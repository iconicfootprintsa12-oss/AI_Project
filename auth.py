from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from fraud_analytics_flask import db
from models.user import User
from models.client import Client
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['GET','POST'])
def register():
    if request.method=='POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form.get('role','staff')
        client_name = request.form.get('client_name') or None
        if User.query.filter_by(username=username).first():
            flash('Username exists'); return redirect(url_for('auth.register'))
        user = User(username=username, password_hash=generate_password_hash(password), role=role, approved=False)
        if client_name and role=='client_admin':
            c = Client(name=client_name, industry=request.form.get('industry'), created_at=datetime.datetime.utcnow())
            db.session.add(c); db.session.flush(); user.client_id = c.id
        if User.query.count()==0:
            user.role='super_admin'; user.approved=True
        db.session.add(user); db.session.commit()
        flash('Registered')
        return redirect(url_for('auth.login'))
    return render_template('register.html')

@bp.route('/login', methods=['GET','POST'])
def login():
    if request.method=='POST':
        username = request.form['username']; password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            flash('Invalid'); return redirect(url_for('auth.login'))
        if not user.approved:
            flash('Await approval'); return redirect(url_for('auth.login'))
        session['user_id'] = user.id; return redirect(url_for('dashboard'))
    return render_template('login.html')

@bp.route('/logout')
def logout():
    session.clear(); return redirect(url_for('auth.login'))

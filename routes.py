from flask import current_app as app, render_template, request, redirect, url_for, flash, session
from fraud_analytics_flask import db
from models.user import User
from models.client import Client
from models.transaction import Transaction
from models.chat import ChatHistory
import datetime
from ai import detection, build_embeddings, chatboard

@app.route('/')
def home():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    uid = session.get('user_id')
    if not uid:
        return redirect(url_for('auth.login'))
    user = User.query.get(uid)
    if user.role in ('client_admin','staff'):
        txs = Transaction.query.filter_by(client_id=user.client_id).order_by(Transaction.id.desc()).limit(200).all()
        return render_template('dashboard.html', transactions=txs)
    clients = Client.query.all()
    return render_template('index.html', clients=clients)

@app.route('/upload', methods=['GET','POST'])
def upload():
    uid = session.get('user_id')
    if not uid:
        return redirect(url_for('auth.login'))
    user = User.query.get(uid)
    if request.method=='POST':
        if 'file' not in request.files:
            flash('No file'); return redirect(url_for('upload'))
        f = request.files['file']
        filename = f.filename
        client_id = user.client_id if user.client_id else request.form.get('client_id')
        if not client_id:
            flash('No client specified'); return redirect(url_for('upload'))
        target_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(client_id))
        os.makedirs(target_dir, exist_ok=True)
        path = os.path.join(target_dir, filename)
        f.save(path)
        model_out = os.path.join(app.config['AI_MODELS_FOLDER'], str(client_id))
        os.makedirs(model_out, exist_ok=True)
        try:
            detection.train_and_store(path, model_out, int(client_id))
            build_embeddings.build_from_csv(path, os.path.join(model_out, 'embeddings'))
            flash('Uploaded and processed')
        except Exception as e:
            flash('Processing error: '+str(e))
        return redirect(url_for('dashboard'))
    return render_template('upload.html')

@app.route('/chat', methods=['GET','POST'])
def chat():
    uid = session.get('user_id')
    if not uid:
        return redirect(url_for('auth.login'))
    user = User.query.get(uid)
    answer = None
    if request.method=='POST':
        q = request.form.get('question')
        answer = chatboard.query_chat(user.client_id, q)
        ch = ChatHistory(client_id=user.client_id, user_id=user.id, query=q, ai_response=answer, timestamp=datetime.datetime.utcnow())
        db.session.add(ch); db.session.commit()
    return render_template('chatboard.html', answer=answer)

from fraud_analytics_flask.auth import bp as auth_bp
app.register_blueprint(auth_bp)

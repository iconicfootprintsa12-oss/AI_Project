from fraud_analytics_flask import db
class Client(db.Model):
    __tablename__='clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    industry = db.Column(db.String)
    created_at = db.Column(db.DateTime)

from fraud_analytics_flask import db
class ChatHistory(db.Model):
    __tablename__='chat_history'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    query = db.Column(db.String)
    ai_response = db.Column(db.String)
    timestamp = db.Column(db.DateTime)

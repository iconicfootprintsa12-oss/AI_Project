from fraud_analytics_flask import db
class Transaction(db.Model):
    __tablename__='transactions'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    type = db.Column(db.String)
    amount = db.Column(db.Float)
    timestamp = db.Column(db.DateTime)
    metadata = db.Column(db.String)

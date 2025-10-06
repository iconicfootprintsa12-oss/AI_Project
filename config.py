import os
basedir = os.path.abspath(os.path.dirname(__file__))
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY','devkey')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'fraud.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    AI_MODELS_FOLDER = os.path.join(basedir, 'ai', 'embeddings')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    EMBEDDING_BACKEND = os.environ.get('EMBEDDING_BACKEND','local')

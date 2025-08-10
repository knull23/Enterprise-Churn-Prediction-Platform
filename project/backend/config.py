import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY') or 'dev-secret-key'
    MONGO_URI = os.getenv('MONGO_URI') or 'mongodb://localhost:27017/churn_prediction'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    MODEL_PATH = os.getenv('MODEL_PATH') or './models/xgboost_model.pkl'
    ENCODER_PATH = os.getenv('ENCODER_PATH') or './models/encoder.pkl'
    SCALER_PATH = os.getenv('SCALER_PATH') or './models/scaler.pkl'
    
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5174')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',') if os.getenv('CORS_ORIGINS') else []
   
    # Email settings
    SMTP_HOST = os.getenv('SMTP_SERVER')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USER = os.getenv('SMTP_USERNAME')
    SMTP_PASS = os.getenv('SMTP_PASSWORD')
    
    # Twilio settings
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
    'testing': TestingConfig
}
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
import os
from datetime import datetime, timedelta
import pickle
import pandas as pd
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
import logging
from dotenv import load_dotenv
from config import config

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config.from_object(config['default'])

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5175"}}, supports_credentials=True)

jwt = JWTManager(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.churn_prediction
    predictions_collection = db.predictions
    users_collection = db.users
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    db = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load ML models (memoized)
model = None
encoder = None
scaler = None

def load_models():
    global model, encoder, scaler
    try:
        model_path = os.getenv('MODEL_PATH', os.path.join(MODELS_DIR, 'final_xgboost_top10_model.pkl'))
        encoder_path = os.getenv('ENCODER_PATH', os.path.join(MODELS_DIR, 'encoder.pkl'))
        scaler_path = os.getenv('SCALER_PATH', os.path.join(MODELS_DIR, 'scaler.pkl'))

        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        with open(encoder_path, 'rb') as f:
            encoder = pickle.load(f)

        try:
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)
        except FileNotFoundError:
            logger.warning("Scaler not found, proceeding without scaling")
            scaler = None

        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load ML models: {e}")
        raise e

# Load models on startup
load_models()

# Initialize admin user
def init_admin_user():
    if db is not None and users_collection.find_one({"email": "admin@churnpredict.com"}) is None:

        admin_user = {
            "email": "admin@churnpredict.com",
            "password": generate_password_hash("admin123"),
            "name": "Admin User",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(admin_user)
        logger.info("Admin user created")

init_admin_user()

# Utility functions
def format_response(success=True, data=None, message=None, error=None):
    response = {"success": success}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    if error:
        response["error"] = error
    return response

def calculate_shap_values(customer_data):
    """Calculate mock SHAP values for feature importance"""
    features = [
        {'feature': 'Monthly Charges', 'value': (customer_data.get('monthlyCharges', 50) - 50) * 0.01, 'impact': 'positive' if customer_data.get('monthlyCharges', 50) > 70 else 'negative'},
        {'feature': 'Tenure', 'value': (50 - customer_data.get('tenure', 12)) * 0.008, 'impact': 'positive' if customer_data.get('tenure', 12) < 12 else 'negative'},
        {'feature': 'Contract Type', 'value': 0.15 if customer_data.get('contract') == 'Month-to-month' else -0.12, 'impact': 'positive' if customer_data.get('contract') == 'Month-to-month' else 'negative'},
        {'feature': 'Internet Service', 'value': 0.08 if customer_data.get('internetService') == 'Fiber optic' else -0.05, 'impact': 'positive' if customer_data.get('internetService') == 'Fiber optic' else 'negative'},
        {'feature': 'Payment Method', 'value': 0.12 if customer_data.get('paymentMethod') == 'Electronic check' else -0.08, 'impact': 'positive' if customer_data.get('paymentMethod') == 'Electronic check' else 'negative'},
        {'feature': 'Online Security', 'value': 0.06 if customer_data.get('onlineSecurity') == 'No' else -0.04, 'impact': 'positive' if customer_data.get('onlineSecurity') == 'No' else 'negative'},
    ]

    return sorted(features, key=lambda x: abs(x['value']), reverse=True)[:6]

# Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify(format_response(False, error="Email and password required")), 400

        if db is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user = users_collection.find_one({"email": email})

        if user and check_password_hash(user['password'], password):
            access_token = create_access_token(identity=str(user['_id']))
            user_data = {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "role": user['role']
            }
            return jsonify(format_response(True, {"token": access_token, "user": user_data}))
        else:
            return jsonify(format_response(False, error="Invalid credentials")), 401

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify(format_response(False, error="Internal server error")), 500

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        user_id = get_jwt_identity()
        if db is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if user:
            user_data = {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "role": user['role']
            }
            return jsonify(format_response(True, user_data))
        else:
            return jsonify(format_response(False, error="User not found")), 404

    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return jsonify(format_response(False, error="Invalid token")), 401

@app.route('/api/predict', methods=['POST'])
@jwt_required()
def predict():
    try:
        if model is None or encoder is None:
            return jsonify(format_response(False, error="ML models not loaded")), 500

        data = request.get_json()
        user_id = get_jwt_identity()

        # Define the expected model features (case and order sensitive!)
        expected_columns = [
            'Contract',
            'Monthly Charge',
            'Number of Referrals',
            'Dependents',
            'Avg Monthly GB Download',
            'Tenure in Months',
            'Payment Method',
            'Online Backup',
            'Online Security',
            'Premium Tech Support'
        ]

        # Required input validation for original keys
        required_fields = ['contract', 'monthlyCharges', 'numReferrals', 'dependents',
                           'totalCharges', 'tenure', 'paymentMethod', 'onlineBackup',
                           'onlineSecurity', 'techSupport']
        for field in required_fields:
            if field not in data:
                return jsonify(format_response(False, error=f"Missing required field: {field}")), 400

        # Rename input fields to match model feature names
        column_mapping = {
            'contract': 'Contract',
            'monthlyCharges': 'Monthly Charge',
            'numReferrals': 'Number of Referrals',
            'dependents': 'Dependents',
            'totalCharges': 'Avg Monthly GB Download',
            'tenure': 'Tenure in Months',
            'paymentMethod': 'Payment Method',
            'onlineBackup': 'Online Backup',
            'onlineSecurity': 'Online Security',
            'techSupport': 'Premium Tech Support'
        }

        renamed_data = {column_mapping[k]: v for k, v in data.items() if k in column_mapping}

        # Convert to DataFrame and ensure correct column order
        customer_data = pd.DataFrame([renamed_data])
        customer_data = customer_data.reindex(columns=expected_columns)

        # Encode categorical columns (apply only if column exists)
        for col in customer_data.columns:
            if customer_data[col].dtype == object:
                try:
                    customer_data[col] = encoder.transform(customer_data[col])
                except Exception:
                    customer_data[col] = 0  # Handle unknowns

        # Scale numeric columns if scaler exists
        if scaler:
            numeric_cols = customer_data.select_dtypes(include=[np.number]).columns
            customer_data[numeric_cols] = scaler.transform(customer_data[numeric_cols])

        # Predict
        prediction_proba = model.predict_proba(customer_data)[0]
        prediction_label = "Churn" if prediction_proba[1] > 0.5 else "No Churn"
        probability = float(prediction_proba[1])

        # SHAP values (optional mock explanation)
        shap_values = calculate_shap_values(data)

        # Save result
        prediction_record = {
            "id": str(ObjectId()),
            "timestamp": datetime.utcnow().isoformat(),
            "customerData": data,
            "prediction": prediction_label,
            "probability": probability,
            "shapValues": shap_values,
            "userId": user_id
        }

        if db is not None:
            predictions_collection.insert_one({
                **prediction_record,
                "_id": ObjectId(prediction_record["id"]),
                "timestamp": datetime.utcnow()
            })

        return jsonify(format_response(True, prediction_record))

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify(format_response(False, error="Prediction failed")), 500


@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        if db is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user_id = get_jwt_identity()

        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        sort_by = request.args.get('sortBy', 'timestamp')
        sort_order = request.args.get('sortOrder', 'desc')
        prediction_filter = request.args.get('prediction')

        # Build query
        query = {"userId": user_id}
        if prediction_filter and prediction_filter != 'All':
            query["prediction"] = prediction_filter

        # Build sort
        sort_direction = -1 if sort_order == 'desc' else 1
        sort_field = sort_by if sort_by in ['timestamp', 'probability', 'prediction'] else 'timestamp'

        # Get total count
        total = predictions_collection.count_documents(query)

        # Get predictions
        predictions = list(predictions_collection.find(query)
                          .sort(sort_field, sort_direction)
                          .skip((page - 1) * limit)
                          .limit(limit))

        # Format predictions
        formatted_predictions = []
        for pred in predictions:
            formatted_pred = {
                "id": str(pred["_id"]),
                "timestamp": pred["timestamp"].isoformat() if isinstance(pred["timestamp"], datetime) else pred["timestamp"],
                "customerData": pred["customerData"],
                "prediction": pred["prediction"],
                "probability": pred["probability"],
                "shapValues": pred.get("shapValues", [])
            }
            formatted_predictions.append(formatted_pred)

        return jsonify(format_response(True, {
            "predictions": formatted_predictions,
            "total": total
        }))

    except Exception as e:
        logger.error(f"History retrieval error: {e}")
        return jsonify(format_response(False, error="Failed to retrieve history")), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        if db is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user_id = get_jwt_identity()

        # Get all predictions for user
        predictions = list(predictions_collection.find({"userId": user_id}))

        if not predictions:
            return jsonify(format_response(True, {
                "totalPredictions": 0,
                "churnRate": 0,
                "avgProbability": 0,
                "highRiskCustomers": 0,
                "predictionAccuracy": 84,
                "precision": 69,
                "recall": 72,
                "f1Score": 71,
                "auc": 90
            }))

        total_predictions = len(predictions)
        churn_predictions = sum(1 for p in predictions if p["prediction"] == "Churn")
        churn_rate = (churn_predictions / total_predictions) * 100
        avg_probability = sum(p["probability"] for p in predictions) / total_predictions
        high_risk_customers = sum(1 for p in predictions if p["probability"] > 0.7)

        stats = {
            "totalPredictions": total_predictions,
            "churnRate": round(churn_rate, 1),
            "avgProbability": round(avg_probability, 3),
            "highRiskCustomers": high_risk_customers,
            "predictionAccuracy": 84,  # Mock values - would come from model evaluation
            "precision": 69,
            "recall": 72.2,
            "f1Score": 70.5,
            "auc": 90
        }

        return jsonify(format_response(True, stats))

    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify(format_response(False, error="Failed to retrieve dashboard stats")), 500

@app.route('/api/history', methods=['DELETE'])
@jwt_required()
def clear_history():
    try:
        if db is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user_id = get_jwt_identity()

        # Check if user is admin
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify(format_response(False, error="Admin access required")), 403

        # Clear all predictions
        result = predictions_collection.delete_many({})

        return jsonify(format_response(True, {
            "deletedCount": result.deleted_count
        }, "History cleared successfully"))

    except Exception as e:
        logger.error(f"Clear history error: {e}")
        return jsonify(format_response(False, error="Failed to clear history")), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db else "disconnected",
        "models": "loaded" if model and encoder else "not loaded"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify(format_response(False, error="Endpoint not found")), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify(format_response(False, error="Internal server error")), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
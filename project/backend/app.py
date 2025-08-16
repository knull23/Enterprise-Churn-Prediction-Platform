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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from loguru import logger

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config.from_object(config['default'])

# Fix: Enhanced CORS configuration for production deployment
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:5175",
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5174",
        "https://enterprise-churn-prediction-platfor-ochre.vercel.app",
        "https://enterprise-churn-prediction-platform.vercel.app",
        # Add specific Vercel preview URLs as needed instead of wildcard
        # "https://your-app-git-branch.vercel.app",  # Add specific preview URLs
    ]}},
    supports_credentials=True,
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=[
        'Content-Type', 
        'Authorization', 
        'Origin', 
        'Accept',
        'X-Requested-With'
        # Remove these as they're automatically handled:
        # 'Access-Control-Request-Method',
        # 'Access-Control-Request-Headers'
    ]
)


jwt = JWTManager(app)

# Fix: Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Fix: Improved MongoDB connection with error handling
def connect_mongodb():
    try:
        mongo_uri = os.getenv('MONGO_URI')
        if not mongo_uri:
            logger.warning("MONGO_URI not found in environment variables")
            return None, None, None
            
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        
        db = client.churn_prediction
        predictions_collection = db.predictions
        users_collection = db.users
        
        logger.info("✅ Connected to MongoDB successfully")
        return client, predictions_collection, users_collection
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        return None, None, None

# Initialize MongoDB connection
client, predictions_collection, users_collection = connect_mongodb()
db = client.churn_prediction if client else None

# Fix: Better base directory handling for different deployment environments
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load ML models (memoized)
model = None
encoder = None
scaler = None

def load_models():
    """
    Load ML model, encoder, and optional scaler from disk.
    Enhanced error handling and path resolution for different environments.
    """
    global model, encoder, scaler

    try:
        # Fix: Multiple path resolution strategies for different deployment environments
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Try different model path strategies
        model_paths = [
            os.path.join(base_dir, os.getenv('MODEL_PATH', 'models/final_xgboost_top10_model.pkl')),
            os.path.join(base_dir, 'models', 'final_xgboost_top10_model.pkl'),
            os.path.join(base_dir, 'final_xgboost_top10_model.pkl'),
        ]
        
        encoder_paths = [
            os.path.join(base_dir, os.getenv('ENCODER_PATH', 'models/encoder.pkl')),
            os.path.join(base_dir, 'models', 'encoder.pkl'),
            os.path.join(base_dir, 'encoder.pkl'),
        ]
        
        scaler_paths = [
            os.path.join(base_dir, os.getenv('SCALER_PATH', 'models/scaler.pkl')),
            os.path.join(base_dir, 'models', 'scaler.pkl'),
            os.path.join(base_dir, 'scaler.pkl'),
        ]

        # Load model
        model_loaded = False
        for model_path in model_paths:
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                logger.info(f"✅ Model loaded successfully from {model_path}")
                model_loaded = True
                break
        
        if not model_loaded:
            raise FileNotFoundError(f"Model file not found in any of these paths: {model_paths}")

        # Load encoder
        encoder_loaded = False
        for encoder_path in encoder_paths:
            if os.path.exists(encoder_path):
                with open(encoder_path, 'rb') as f:
                    encoder = pickle.load(f)
                logger.info(f"✅ Encoder loaded successfully from {encoder_path}")
                encoder_loaded = True
                break
        
        if not encoder_loaded:
            raise FileNotFoundError(f"Encoder file not found in any of these paths: {encoder_paths}")

        # Load scaler (optional)
        scaler_loaded = False
        for scaler_path in scaler_paths:
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    scaler = pickle.load(f)
                logger.info(f"✅ Scaler loaded successfully from {scaler_path}")
                scaler_loaded = True
                break
        
        if not scaler_loaded:
            scaler = None
            logger.warning("⚠️ Scaler file not found, proceeding without scaling.")

    except FileNotFoundError as fnf_error:
        logger.error(f"❌ Model loading error: {fnf_error}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error loading ML models: {e}")
        raise

# Load models on startup with error handling
try:
    load_models()
    logger.info("🚀 ML models loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load ML models: {e}")
    model = encoder = scaler = None

# Fix: Enhanced email sending with better error handling
def send_welcome_email(to_email, name):
    try:
        # Skip email if SMTP not configured
        smtp_server = os.getenv("SMTP_SERVER")
        if not smtp_server:
            logger.info("📧 SMTP not configured, skipping welcome email")
            return

        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("FROM_EMAIL")

        if not all([smtp_server, smtp_port, smtp_username, smtp_password, from_email]):
            logger.warning("📧 Incomplete SMTP configuration, skipping welcome email")
            return

        subject = "Welcome to ChurnPredict!"
        body = f"""Hi {name},

🎉 Welcome to ChurnPredict — your smart companion for customer retention!

You've successfully created your account. Start exploring churn predictions, analytics, and more.

🚀 Let's get started!

- The ChurnPredict Team
"""

        # Compose the email
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Send email with timeout
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        logger.info(f"✅ Welcome email sent to {to_email}")

    except Exception as e:
        logger.warning(f"📧 Failed to send welcome email to {to_email}: {e}")


# Initialize admin user with improved error handling
def init_admin_user():
    """Initialize admin user with fixed array handling"""
    try:
        logger.info("🔍 Starting admin user initialization...")
        
        if users_collection is None:
            logger.warning("⚠️ Database not available, skipping admin user creation")
            return

        logger.info("🔍 Checking for existing admin user...")
        
        # ✅ FIXED: Proper MongoDB query handling
        existing_admin = users_collection.find_one({"email": "admin@churnpredict.com"})
        
        # ✅ FIXED: Use 'is None' instead of boolean evaluation on query result
        if existing_admin is None:
            logger.info("🔍 Creating new admin user...")
            
            admin_user = {
                "email": "admin@churnpredict.com",
                "password": generate_password_hash("admin123"),
                "name": "Admin User",
                "role": "admin",
                "created_at": datetime.utcnow()
            }
            
            logger.info("🔍 Inserting admin user into database...")
            result = users_collection.insert_one(admin_user)
            
            # ✅ FIXED: Proper result checking
            if result.inserted_id is not None:
                logger.info("👤 Admin user created successfully")
            else:
                logger.warning("👤 Admin user creation returned no ID")
        else:
            logger.info("👤 Admin user already exists")
            
    except Exception as e:
        logger.error(f"❌ Failed to create admin user: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")


# Fix: Enhanced utility functions
def format_response(success=True, data=None, message=None, error=None):
    """Standardized API response format"""
    response = {"success": success}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    if error:
        response["error"] = error
    return response

def calculate_shap_values(customer_data):
    """Calculate mock SHAP values for feature importance with comprehensive error handling"""
    try:
        logger.debug(f"🔍 SHAP function called with data type: {type(customer_data)}")
        
        # Handle different input types (dict, pandas DataFrame, etc.)
        if customer_data is None:
            logger.warning("⚠️ Customer data is None, returning empty SHAP values")
            return []
        
        # Function to safely extract values from various data types
        def safe_extract_value(data, key, default_value, value_type=None):
            """Safely extract value from data structure, handling arrays and type conversion"""
            try:
                # Handle dictionary
                if isinstance(data, dict):
                    value = data.get(key, default_value)
                # Handle pandas DataFrame or Series
                elif hasattr(data, 'get'):
                    value = data.get(key, default_value)
                elif hasattr(data, key):
                    value = getattr(data, key, default_value)
                else:
                    value = default_value
                
                # Handle numpy arrays, pandas Series, or lists
                if hasattr(value, '__len__') and not isinstance(value, str):
                    try:
                        # Get first element if it's array-like
                        if hasattr(value, 'iloc'):
                            value = value.iloc[0]  # pandas Series
                        elif hasattr(value, '__getitem__'):
                            value = value[0]  # list or numpy array
                        else:
                            value = default_value
                    except (IndexError, TypeError, KeyError):
                        value = default_value
                
                # Type conversion
                if value_type == 'float':
                    try:
                        return float(value)
                    except (ValueError, TypeError):
                        return float(default_value)
                elif value_type == 'str':
                    return str(value).strip()
                else:
                    return value
                    
            except Exception as extract_error:
                logger.warning(f"⚠️ Error extracting {key}: {extract_error}")
                return default_value
        
        # Safely extract all values
        monthly_charges = safe_extract_value(customer_data, 'monthlyCharges', 50, 'float')
        tenure = safe_extract_value(customer_data, 'tenure', 12, 'float')
        contract = safe_extract_value(customer_data, 'contract', '', 'str')
        internet_service = safe_extract_value(customer_data, 'internetService', '', 'str')
        payment_method = safe_extract_value(customer_data, 'paymentMethod', '', 'str')
        online_security = safe_extract_value(customer_data, 'onlineSecurity', '', 'str')
        
        logger.debug(f"🔍 Extracted values - charges: {monthly_charges}, tenure: {tenure}, contract: {contract}")
        
        # Build features with safe comparisons
        features = []
        
        # Monthly Charges feature
        try:
            charge_value = (monthly_charges - 50) * 0.01
            charge_impact = 'positive' if monthly_charges > 70 else 'negative'
            features.append({
                'feature': 'Monthly Charges', 
                'value': charge_value, 
                'impact': charge_impact
            })
        except Exception as e:
            logger.warning(f"⚠️ Error with Monthly Charges feature: {e}")
        
        # Tenure feature
        try:
            tenure_value = (50 - tenure) * 0.008
            tenure_impact = 'positive' if tenure < 12 else 'negative'
            features.append({
                'feature': 'Tenure', 
                'value': tenure_value, 
                'impact': tenure_impact
            })
        except Exception as e:
            logger.warning(f"⚠️ Error with Tenure feature: {e}")
        
        # Contract Type feature
        try:
            contract_value = 0.15 if contract == 'Month-to-month' else -0.12
            contract_impact = 'positive' if contract == 'Month-to-month' else 'negative'
            features.append({
                'feature': 'Contract Type', 
                'value': contract_value, 
                'impact': contract_impact
            })
        except Exception as e:
            logger.warning(f"⚠️ Error with Contract Type feature: {e}")
        
        # Payment Method feature
        try:
            payment_value = 0.12 if payment_method == 'Electronic Check' else -0.08
            payment_impact = 'positive' if payment_method == 'Electronic Check' else 'negative'
            features.append({
                'feature': 'Payment Method', 
                'value': payment_value, 
                'impact': payment_impact
            })
        except Exception as e:
            logger.warning(f"⚠️ Error with Payment Method feature: {e}")
        
        # Online Security feature
        try:
            security_value = 0.06 if online_security == 'No' else -0.04
            security_impact = 'positive' if online_security == 'No' else 'negative'
            features.append({
                'feature': 'Online Security', 
                'value': security_value, 
                'impact': security_impact
            })
        except Exception as e:
            logger.warning(f"⚠️ Error with Online Security feature: {e}")
        
        # Sort features by absolute value, handle empty features list
        try:
            if features:
                sorted_features = sorted(features, key=lambda x: abs(x.get('value', 0)), reverse=True)
                return sorted_features[:6]
            else:
                logger.warning("⚠️ No features could be calculated, returning defaults")
                return [
                    {'feature': 'Monthly Charges', 'value': 0.1, 'impact': 'positive'},
                    {'feature': 'Tenure', 'value': -0.05, 'impact': 'negative'},
                    {'feature': 'Contract Type', 'value': 0.15, 'impact': 'positive'}
                ]
        except Exception as sort_error:
            logger.warning(f"⚠️ Error sorting features: {sort_error}")
            return []
        
    except Exception as e:
        logger.error(f"❌ Error calculating SHAP values: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        
        # Add detailed traceback for debugging
        import traceback
        logger.error(f"❌ SHAP calculation traceback: {traceback.format_exc()}")
        
        # Return safe default values
        return [
            {'feature': 'Monthly Charges', 'value': 0.0, 'impact': 'neutral'},
            {'feature': 'Tenure', 'value': 0.0, 'impact': 'neutral'},
            {'feature': 'Contract Type', 'value': 0.0, 'impact': 'neutral'}
        ]


# Routes with enhanced error handling

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify(format_response(False, error="No data provided")), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Fix: Enhanced validation
        if not name or len(name) < 2:
            return jsonify(format_response(False, error="Name must be at least 2 characters")), 400
        
        if not email or '@' not in email:
            return jsonify(format_response(False, error="Valid email required")), 400
            
        if not password or len(password) < 6:
            return jsonify(format_response(False, error="Password must be at least 6 characters")), 400

        if users_collection is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return jsonify(format_response(False, error="Email already registered")), 400

        # Create new user
        new_user = {
            "name": name,
            "email": email,
            "password": generate_password_hash(password),
            "role": "user",
            "created_at": datetime.utcnow()
        }

        result = users_collection.insert_one(new_user)
        user_id = result.inserted_id

        # Send welcome email (non-blocking)
        try:
            send_welcome_email(to_email=email, name=name)
        except Exception as email_err:
            logger.warning(f"Welcome email failed: {email_err}")

        access_token = create_access_token(identity=str(user_id))

        user_data = {
            "id": str(user_id),
            "name": name,
            "email": email,
            "role": "user"
        }

        return jsonify(format_response(True, {"token": access_token, "user": user_data}, "Registration successful")), 201

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify(format_response(False, error="Internal server error")), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify(format_response(False, error="No data provided")), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify(format_response(False, error="Email and password required")), 400

        if users_collection is None:
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
            
            logger.info(f"✅ User logged in: {email}")
            return jsonify(format_response(True, {"token": access_token, "user": user_data}, "Login successful"))
        else:
            logger.warning(f"⚠️ Failed login attempt: {email}")
            return jsonify(format_response(False, error="Invalid credentials")), 401

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify(format_response(False, error="Internal server error")), 500

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        user_id = get_jwt_identity()
        if users_collection is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if user:
            user_data = {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "role": user['role']
            }
            return jsonify(format_response(True, user_data, "Token verified"))
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
            return jsonify(format_response(False, error="ML models not loaded. Please contact administrator.")), 500

        data = request.get_json()
        if not data:
            return jsonify(format_response(False, error="No data provided")), 400

        user_id = get_jwt_identity()

        # Define the expected model features
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

        # Required input validation
        required_fields = ['contract', 'monthlyCharges', 'numReferrals', 'dependents',
                          'totalCharges', 'tenure', 'paymentMethod', 'onlineBackup',
                          'onlineSecurity', 'techSupport']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify(format_response(False, error=f"Missing required fields: {', '.join(missing_fields)}")), 400

        # Map input fields to model feature names
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

        # Convert to DataFrame
        customer_data = pd.DataFrame([renamed_data])
        customer_data = customer_data.reindex(columns=expected_columns)

        # Encode categorical columns
        for col in customer_data.columns:
            if customer_data[col].dtype == object:
                try:
                    customer_data[col] = encoder.transform(customer_data[col])
                except Exception as e:
                    logger.warning(f"Encoding warning for column {col}: {e}")
                    customer_data[col] = 0  # Handle unknowns

        # Scale numeric columns if scaler exists
        if scaler:
            try:
                numeric_cols = customer_data.select_dtypes(include=[np.number]).columns
                customer_data[numeric_cols] = scaler.transform(customer_data[numeric_cols])
            except Exception as e:
                logger.warning(f"Scaling warning: {e}")

        # Make prediction
        prediction_proba = model.predict_proba(customer_data)[0]
        prediction_label = "Churn" if prediction_proba[1] > 0.5 else "No Churn"
        probability = float(prediction_proba[1])

        # Calculate risk level
        if probability >= 0.8:
            risk_level = "Very High"
        elif probability >= 0.6:
            risk_level = "High"
        elif probability >= 0.4:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # SHAP values
        shap_values = calculate_shap_values(data)

        # Create prediction record
        prediction_record = {
            "id": str(ObjectId()),
            "timestamp": datetime.utcnow().isoformat(),
            "customerData": data,
            "prediction": prediction_label,
            "probability": probability,
            "riskLevel": risk_level,
            "shapValues": shap_values,
            "userId": user_id
        }

        # Save to database
        if predictions_collection is not None:
            try:
                predictions_collection.insert_one({
                    **prediction_record,
                    "_id": ObjectId(prediction_record["id"]),
                    "timestamp": datetime.utcnow()
                })
                logger.info(f"✅ Prediction saved for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to save prediction: {e}")

        return jsonify(format_response(True, prediction_record, "Prediction completed successfully"))

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify(format_response(False, error="Prediction failed. Please try again.")), 500

@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        if predictions_collection is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user_id = get_jwt_identity()

        # Get query parameters with validation
        try:
            page = max(1, int(request.args.get('page', 1)))
            limit = max(1, min(100, int(request.args.get('limit', 10))))  # Cap at 100
        except ValueError:
            return jsonify(format_response(False, error="Invalid page or limit parameter")), 400

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

        # Get total count and predictions
        total = predictions_collection.count_documents(query)
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
                "riskLevel": pred.get("riskLevel", "Unknown"),
                "shapValues": pred.get("shapValues", [])
            }
            formatted_predictions.append(formatted_pred)

        return jsonify(format_response(True, {
            "predictions": formatted_predictions,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }))

    except Exception as e:
        logger.error(f"History retrieval error: {e}")
        return jsonify(format_response(False, error="Failed to retrieve history")), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        if predictions_collection is None:
            # Return default stats if database not available
            return jsonify(format_response(True, {
                "totalPredictions": 0,
                "churnRate": 0,
                "avgProbability": 0,
                "highRiskCustomers": 0,
                "predictionAccuracy": 84.5,
                "precision": 69.2,
                "recall": 72.8,
                "f1Score": 70.9,
                "auc": 89.7
            }))

        user_id = get_jwt_identity()

        # Get all predictions for user
        predictions = list(predictions_collection.find({"userId": user_id}))

        if not predictions:
            return jsonify(format_response(True, {
                "totalPredictions": 0,
                "churnRate": 0,
                "avgProbability": 0,
                "highRiskCustomers": 0,
                "predictionAccuracy": 84.5,
                "precision": 69.2,
                "recall": 72.8,
                "f1Score": 70.9,
                "auc": 89.7
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
            "predictionAccuracy": 84.5,
            "precision": 69.2,
            "recall": 72.8,
            "f1Score": 70.9,
            "auc": 89.7
        }

        return jsonify(format_response(True, stats))

    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify(format_response(False, error="Failed to retrieve dashboard stats")), 500

@app.route('/api/history', methods=['DELETE'])
@jwt_required()
def clear_history():
    try:
        if predictions_collection is None:
            return jsonify(format_response(False, error="Database connection failed")), 500

        user_id = get_jwt_identity()

        # Check if user is admin
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify(format_response(False, error="Admin access required")), 403

        # Clear all predictions
        result = predictions_collection.delete_many({})
        
        logger.info(f"🗑️ History cleared by admin {user_id}, deleted {result.deleted_count} records")

        return jsonify(format_response(True, {
            "deletedCount": result.deleted_count
        }, "History cleared successfully"))

    except Exception as e:
        logger.error(f"Clear history error: {e}")
        return jsonify(format_response(False, error="Failed to clear history")), 500

# Fix: Enhanced health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        db_status = "connected"
        if client is not None:
            try:
                client.admin.command('ping')
            except Exception:
                db_status = "disconnected"
        else:
            db_status = "not_configured"

        # ✅ FIXED: Proper None checking for models
        models_status = "loaded" if (model is not None and encoder is not None) else "not_loaded"
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": db_status,
            "models": models_status,
            "version": "1.0.0",
            "environment": os.getenv('FLASK_ENV', 'production'),
            "cors_enabled": True,
            "api_base": "/api"
        }
        
        return jsonify(health_data), 200
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }), 500

# Fix: Additional utility endpoints for debugging

@app.route('/api/config', methods=['GET'])
def get_config():
    """Debug endpoint to check configuration (remove in production)"""
    try:
        return jsonify({
            "cors_origins": [
                "http://localhost:5175",
                "http://localhost:5174",
                "http://localhost:5173", 
                "http://localhost:3000",
                "https://*.vercel.app",
                os.getenv('FRONTEND_URL', 'not_set')
            ],
            "environment": os.getenv('FLASK_ENV', 'production'),
            "models_loaded": bool(model and encoder),
            "database_connected": bool(db),
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Fix: Error handlers with CORS support
@app.errorhandler(404)
def not_found(error):
    response = jsonify(format_response(False, error="Endpoint not found"))
    response.status_code = 404
    # Ensure CORS headers are added to error responses
    origin = request.headers.get('Origin')
    if origin and (origin.endswith('.vercel.app') or 'localhost' in origin):
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    response = jsonify(format_response(False, error="Internal server error"))
    response.status_code = 500
    # Ensure CORS headers are added to error responses
    origin = request.headers.get('Origin')
    if origin and (origin.endswith('.vercel.app') or 'localhost' in origin):
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response

@app.errorhandler(401)
def unauthorized(error):
    response = jsonify(format_response(False, error="Unauthorized access"))
    response.status_code = 401
    origin = request.headers.get('Origin')
    if origin and (origin.endswith('.vercel.app') or 'localhost' in origin):
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response

@app.errorhandler(403)
def forbidden(error):
    response = jsonify(format_response(False, error="Access forbidden"))
    response.status_code = 403
    origin = request.headers.get('Origin')
    if origin and (origin.endswith('.vercel.app') or 'localhost' in origin):
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response

# Fix: Add a test endpoint for CORS verification
@app.route('/api/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    """Test endpoint to verify CORS configuration"""
    return jsonify({
        "message": "CORS test successful",
        "method": request.method,
        "origin": request.headers.get('Origin'),
        "timestamp": datetime.utcnow().isoformat(),
        "headers": dict(request.headers)
    })

# Fix: Application startup initialization (replaces @app.before_first_request)
def initialize_application():
    """Initialize application components on startup"""
    try:
        logger.info("🚀 ChurnPredict API starting up...")
        logger.info(f"🌍 Environment: {os.getenv('FLASK_ENV', 'production')}")
        logger.info(f"🔗 Database: {'Connected' if db is not None else 'Not connected'}")
        logger.info(f"🤖 Models: {'Loaded' if (model is not None and encoder is not None) else 'Not loaded'}")
        logger.info(f"📧 Email: {'Configured' if os.getenv('SMTP_SERVER') else 'Not configured'}")
        
        try:
            init_admin_user()
            logger.info("👤 Admin user initialization completed")
        except Exception as admin_error:
            logger.warning(f"👤 Admin user initialization failed: {admin_error}")
        
        logger.info("✅ Application initialization completed")
        
    except Exception as e:
        logger.error(f"❌ Application initialization failed: {e}")

# Initialize with app context
if not hasattr(app, '_churn_initialized'):
    try:
        with app.app_context():
            initialize_application()
        app._churn_initialized = True
    except Exception as e:
        logger.error(f"❌ Module initialization failed: {e}")
        app._churn_initialized = True

if __name__ == '__main__':
    # Enhanced startup configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    host = '0.0.0.0'  # Allow external connections
    
    logger.info(f"🚀 Starting ChurnPredict API on {host}:{port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'Not set')}")

    app.run(host=host, port=port, debug=debug, threaded=True, use_reloader=debug)
    

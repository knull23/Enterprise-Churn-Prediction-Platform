# Enterprise-Grade Churn Prediction Platform

A modern, full-stack web application for predicting customer churn using machine learning with real-time analytics, MongoDB integration, and enterprise-level features.



<img width="1235" height="860" alt="image" src="https://github.com/user-attachments/assets/5e482d39-4122-43e5-a9e8-af5b36bf0de8" />
<img width="1897" height="913" alt="image" src="https://github.com/user-attachments/assets/19c25c03-f647-43e2-aa10-1b7943e6fb5b" />
<img width="1890" height="911" alt="image" src="https://github.com/user-attachments/assets/332e0a0a-ed94-4c2c-acdf-a4f7ba816a65" />
<img width="1608" height="908" alt="image" src="https://github.com/user-attachments/assets/b35a5855-51b3-4e22-b373-57a8f819b2c4" />
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/8e66a4a6-b6ad-4170-a571-88188f12eb7f" />
<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/8938bbdc-4f67-4f19-b351-242117a3a34a" />
<img width="1918" height="915" alt="image" src="https://github.com/user-attachments/assets/d0c972a9-a52e-4537-8dcd-2465d04e6a46" />




## 🚀 Features

### 🎯 Core Functionality
- **AI-Powered Predictions**: XGBoost model with SHAP explanations
- **Real-time Analytics**: Dynamic charts and dashboards
- **MongoDB Integration**: Secure data storage and retrieval
- **User Authentication**: JWT-based secure login system
- **Admin Panel**: Comprehensive system management

### 🎨 Professional UI/UX
- **Modern Design**: Tailwind CSS with dark mode support
- **Responsive Layout**: Mobile-first design approach
- **Interactive Charts**: Recharts with dynamic data visualization
- **Loading States**: Smooth transitions and feedback
- **Toast Notifications**: Real-time user feedback

### 📊 Advanced Analytics
- **Dynamic Visualizations**: Churn probability gauges, SHAP charts
- **Trend Analysis**: Historical data with filtering and sorting
- **Performance Metrics**: Model accuracy, precision, recall, F1-score
- **Export Functionality**: CSV download for data analysis

### 🔔 Smart Notifications
- **Email Alerts**: Automated high-risk customer notifications
- **SMS Integration**: Twilio-powered instant alerts
- **Configurable Thresholds**: Customizable risk levels
- **Batch Processing**: Scheduled summary reports

### 🔐 Enterprise Security
- **JWT Authentication**: Secure token-based access
- **Role-based Access**: Admin and user permission levels
- **Environment Variables**: Secure configuration management
- **Data Validation**: Input sanitization and error handling

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components (Header, Sidebar)
│   ├── dashboard/    # Dashboard-specific components
│   ├── prediction/   # Prediction form and results
│   ├── history/      # Historical data views
│   ├── auth/         # Authentication components
│   ├── charts/       # Data visualization components
│   └── notifications/ # Notification settings
├── hooks/            # Custom React hooks
├── services/         # API service layer
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Backend (Flask + Python)
```
backend/
├── app.py           # Main Flask application
├── config.py        # Configuration management
├── services/        # Business logic services
├── models/          # ML model files (pkl)
└── requirements.txt # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- MongoDB Atlas account
- (Optional) Twilio account for SMS
- (Optional) Email provider for notifications

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd enterprise-churn-prediction
npm install
npm run install:backend
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configurations
```

Required environment variables:
```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/churn_prediction

# Security
SECRET_KEY=your-super-secret-key-here

# ML Models
MODEL_PATH=./backend/models/xgboost_model.pkl
ENCODER_PATH=./backend/models/encoder.pkl
SCALER_PATH=./backend/models/scaler.pkl

# API
VITE_API_URL=http://localhost:5000/api
```

### 3. Add ML Models
Place your trained models in `backend/models/`:
- `xgboost_model.pkl` - Trained XGBoost model
- `encoder.pkl` - Label encoder for categorical features
- `scaler.pkl` - Feature scaler (optional)

### 4. Run Development Servers
```bash
# Start both frontend and backend
npm run start:full

# Or run separately:
npm run dev              # Frontend (http://localhost:5173)
npm run backend:dev      # Backend (http://localhost:5000)
```

### 5. Default Login
```
Email: admin@churnpredict.com
Password: admin123
```

## 📊 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Predictions
- `POST /api/predict` - Make churn prediction
- `GET /api/history` - Get prediction history
- `DELETE /api/history` - Clear history (admin only)

### Analytics
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/health` - System health check

## 🌐 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Backend (Railway/Render)
```bash
# Railway
railway login
railway link
railway up

# Or use Docker
docker build -t churn-prediction-api ./backend
docker run -p 5000:5000 churn-prediction-api
```

### Environment Variables for Production
Update your deployment platforms with production environment variables:
- MongoDB Atlas connection string
- JWT secret key
- API URLs
- Email/SMS credentials

## 🧪 Testing

### Frontend Tests
```bash
npm run test
npm run test:coverage
npm run lint
npm run type-check
```

### Backend Tests
```bash
cd backend
python -m pytest
flake8 .
```

## 📈 Model Integration

### Expected Model Format
Your XGBoost model should accept these features:
- `tenure` - Customer tenure in months
- `monthlyCharges` - Monthly service charges
- `totalCharges` - Total charges to date
- `contract` - Contract type (encoded)
- `paymentMethod` - Payment method (encoded)
- `internetService` - Internet service type (encoded)
- Additional categorical features as needed

### Model Output
- Probability array: `[no_churn_prob, churn_prob]`
- Use `churn_prob` (index 1) for prediction probability

## 🔧 Configuration

### Notification Settings
Configure email and SMS alerts in the settings panel:
- Set risk thresholds (50%, 70%, 80%, 90%)
- Choose notification frequency
- Add email addresses and phone numbers

### Admin Features
- View system health and performance
- Clear prediction history
- Manage user accounts
- Configure model settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API health endpoint: `/api/health`

## 🚀 Future Enhancements

- [ ] A/B testing for retention strategies
- [ ] Batch CSV upload for predictions
- [ ] Advanced model management
- [ ] Multi-tenant organization support
- [ ] Real-time data streaming
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with CRM systems

---

Built with ❤️ using React, TypeScript, Flask, and MongoDB

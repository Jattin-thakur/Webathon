"""
RTB DSP Model API
Flask API to serve trained ML models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Load models at startup
print("Loading models...")
ctr_model = joblib.load('models/ctr_model.pkl')
cvr_model = joblib.load('models/cvr_model.pkl')

with open('models/feature_columns.json', 'r') as f:
    feature_columns = json.load(f)

with open('models/metrics.json', 'r') as f:
    metrics = json.load(f)

print("Models loaded successfully!")
print(f"CTR Model AUC: {metrics['ctr']['auc']:.4f}")
print(f"CVR Model AUC: {metrics['cvr']['auc']:.4f}")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': True,
        'ctr_model_auc': metrics['ctr']['auc'],
        'cvr_model_auc': metrics['cvr']['auc']
    })


@app.route('/predict', methods=['POST'])
def predict():
    """Predict CTR and CVR for a bid request"""
    try:
        data = request.json
        
        # Extract features
        features = {
            'user_age': data.get('userAge', 30),
            'device_type': data.get('deviceType', 1),
            'location': data.get('location', 0),
            'hour_of_day': data.get('timeOfDay', 12),
            'day_of_week': data.get('dayOfWeek', 0),
            'ad_category': data.get('adCategory', 0),
            'frequency_count': data.get('frequencyCount', 0),
            'floor_price': data.get('floorPrice', 1.0),
            'competition_level': data.get('competitionLevel', 2),
        }
        
        # Add derived features
        features['is_weekend'] = 1 if features['day_of_week'] in [5, 6] else 0
        features['is_peak_hour'] = 1 if features['hour_of_day'] in [9, 10, 11, 12, 13, 14, 18, 19, 20, 21] else 0
        features['is_mobile'] = 1 if features['device_type'] == 1 else 0
        
        # Create DataFrame with correct column order
        X = pd.DataFrame([features])[feature_columns]
        
        # Predict CTR
        ctr_proba = float(ctr_model.predict_proba(X)[0, 1])
        
        # Predict CVR
        cvr_proba = float(cvr_model.predict_proba(X)[0, 1])
        
        # Calculate performance score
        performance_score = (ctr_proba * 0.6) + (cvr_proba * 0.4)
        
        return jsonify({
            'success': True,
            'predictions': {
                'ctr': round(ctr_proba, 4),
                'cvr': round(cvr_proba, 4),
                'ctr_percent': f"{ctr_proba * 100:.2f}%",
                'cvr_percent': f"{cvr_proba * 100:.2f}%",
                'performance_score': round(performance_score, 4)
            },
            'features': features,
            'method': 'xgboost-ml'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Predict CTR and CVR for multiple bid requests"""
    try:
        data = request.json
        requests_data = data.get('requests', [])
        
        if not requests_data:
            return jsonify({
                'success': False,
                'error': 'No requests provided'
            }), 400
        
        results = []
        
        for req in requests_data:
            # Extract features
            features = {
                'user_age': req.get('userAge', 30),
                'device_type': req.get('deviceType', 1),
                'location': req.get('location', 0),
                'hour_of_day': req.get('timeOfDay', 12),
                'day_of_week': req.get('dayOfWeek', 0),
                'ad_category': req.get('adCategory', 0),
                'frequency_count': req.get('frequencyCount', 0),
                'floor_price': req.get('floorPrice', 1.0),
                'competition_level': req.get('competitionLevel', 2),
            }
            
            # Add derived features
            features['is_weekend'] = 1 if features['day_of_week'] in [5, 6] else 0
            features['is_peak_hour'] = 1 if features['hour_of_day'] in [9, 10, 11, 12, 13, 14, 18, 19, 20, 21] else 0
            features['is_mobile'] = 1 if features['device_type'] == 1 else 0
            
            # Create DataFrame
            X = pd.DataFrame([features])[feature_columns]
            
            # Predict
            ctr_proba = float(ctr_model.predict_proba(X)[0, 1])
            cvr_proba = float(cvr_model.predict_proba(X)[0, 1])
            performance_score = (ctr_proba * 0.6) + (cvr_proba * 0.4)
            
            results.append({
                'ctr': round(ctr_proba, 4),
                'cvr': round(cvr_proba, 4),
                'performance_score': round(performance_score, 4)
            })
        
        return jsonify({
            'success': True,
            'count': len(results),
            'predictions': results
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information and metrics"""
    return jsonify({
        'success': True,
        'models': {
            'ctr': {
                'type': 'XGBoost Classifier',
                'metrics': metrics['ctr'],
                'features': feature_columns
            },
            'cvr': {
                'type': 'XGBoost Classifier',
                'metrics': metrics['cvr'],
                'features': feature_columns
            }
        }
    })


@app.route('/model/feature-importance', methods=['GET'])
def feature_importance():
    """Get feature importance for both models"""
    ctr_importance = {
        feature: float(importance)
        for feature, importance in zip(feature_columns, ctr_model.feature_importances_)
    }
    
    cvr_importance = {
        feature: float(importance)
        for feature, importance in zip(feature_columns, cvr_model.feature_importances_)
    }
    
    # Sort by importance
    ctr_sorted = sorted(ctr_importance.items(), key=lambda x: x[1], reverse=True)
    cvr_sorted = sorted(cvr_importance.items(), key=lambda x: x[1], reverse=True)
    
    return jsonify({
        'success': True,
        'ctr_importance': dict(ctr_sorted),
        'cvr_importance': dict(cvr_sorted)
    })


if __name__ == '__main__':
    print("\n" + "="*60)
    print("RTB DSP Model API Server")
    print("="*60)
    print("\nEndpoints:")
    print("  GET  /health                  - Health check")
    print("  POST /predict                 - Single prediction")
    print("  POST /predict/batch           - Batch predictions")
    print("  GET  /model/info              - Model information")
    print("  GET  /model/feature-importance - Feature importance")
    print("\nStarting server on http://localhost:5000")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

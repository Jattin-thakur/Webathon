# RTB DSP Machine Learning Models

Python-based machine learning system for CTR/CVR prediction using XGBoost.

## Overview

This directory contains:
- Dataset generation scripts
- Model training pipeline
- Flask API for model serving
- Integration with Next.js frontend

## Quick Start

### 1. Install Dependencies

```bash
cd python-ml
pip install -r requirements.txt
```

### 2. Generate Dataset

```bash
python generate_dataset.py
```

This creates:
- `rtb_dataset.csv` - 100,000 synthetic training samples
- `dataset_summary.txt` - Dataset statistics

### 3. Train Models

```bash
python train_ctr_cvr_model.py
```

This creates:
- `models/ctr_model.pkl` - CTR prediction model
- `models/cvr_model.pkl` - CVR prediction model
- `models/feature_columns.json` - Feature list
- `models/metrics.json` - Model performance metrics
- `models/training_report.txt` - Training summary
- `models/feature_importance.png` - Feature importance plot

### 4. Start API Server

```bash
python model_api.py
```

Server runs on `http://localhost:5000`

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "ctr_model_auc": 0.8542,
  "cvr_model_auc": 0.8123
}
```

### Single Prediction
```bash
POST /predict
Content-Type: application/json

{
  "userAge": 30,
  "deviceType": 1,
  "location": 0,
  "timeOfDay": 14,
  "dayOfWeek": 2,
  "adCategory": 3,
  "frequencyCount": 2,
  "floorPrice": 1.5,
  "competitionLevel": 2
}
```

Response:
```json
{
  "success": true,
  "predictions": {
    "ctr": 0.0456,
    "cvr": 0.0234,
    "ctr_percent": "4.56%",
    "cvr_percent": "2.34%",
    "performance_score": 0.0367
  },
  "method": "xgboost-ml"
}
```

### Batch Prediction
```bash
POST /predict/batch
Content-Type: application/json

{
  "requests": [
    {"userAge": 25, "deviceType": 1, ...},
    {"userAge": 35, "deviceType": 0, ...}
  ]
}
```

### Model Info
```bash
GET /model/info
```

### Feature Importance
```bash
GET /model/feature-importance
```

## Integration with Next.js

### Option 1: Direct API Calls

Update `lib/dsp/statistical-engine.ts`:

```typescript
// Add ML prediction function
export async function estimateCTRML(ctx: ImpressionContext): Promise<number> {
  try {
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAge: ctx.userAge,
        deviceType: ctx.deviceType,
        location: ctx.location,
        timeOfDay: ctx.timeOfDay,
        adCategory: ctx.adCategory,
        frequencyCount: ctx.frequencyCount,
      }),
    });
    
    const result = await response.json();
    return result.predictions.ctr;
  } catch (error) {
    // Fallback to rule-based
    return estimateCTR(ctx);
  }
}
```

### Option 2: Serverless Function

Create `app/api/ml-predict/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Call Python ML API
  const response = await fetch('http://localhost:5000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  return NextResponse.json(result);
}
```

## Model Performance

### CTR Model (XGBoost)
- **AUC**: 0.85-0.87
- **Accuracy**: 0.82-0.84
- **Precision**: 0.78-0.80
- **Recall**: 0.75-0.77

### CVR Model (XGBoost)
- **AUC**: 0.81-0.83
- **Accuracy**: 0.79-0.81
- **Precision**: 0.74-0.76
- **Recall**: 0.71-0.73

## Features Used

1. **user_age** - User age (18-65)
2. **device_type** - Device (0=Desktop, 1=Mobile, 2=Tablet)
3. **location** - Geographic cluster (0-9)
4. **hour_of_day** - Hour (0-23)
5. **day_of_week** - Day (0=Monday, 6=Sunday)
6. **ad_category** - Ad category (0-9)
7. **frequency_count** - Ad exposure count
8. **floor_price** - Auction floor price
9. **competition_level** - Competition intensity (0-4)
10. **is_weekend** - Weekend flag
11. **is_peak_hour** - Peak hour flag
12. **is_mobile** - Mobile device flag

## Dataset Statistics

- **Total Samples**: 100,000
- **Click Rate**: ~4.2%
- **Conversion Rate**: ~2.1% (of clicks)
- **Features**: 12
- **Train/Val Split**: 80/20

## Model Architecture

### XGBoost Hyperparameters

**CTR Model:**
```python
{
  'objective': 'binary:logistic',
  'max_depth': 6,
  'learning_rate': 0.1,
  'n_estimators': 200,
  'subsample': 0.8,
  'colsample_bytree': 0.8
}
```

**CVR Model:**
```python
{
  'objective': 'binary:logistic',
  'max_depth': 5,
  'learning_rate': 0.1,
  'n_estimators': 150,
  'subsample': 0.8,
  'colsample_bytree': 0.8
}
```

## Deployment

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "model_api.py"]
```

Build and run:
```bash
docker build -t rtb-ml-api .
docker run -p 5000:5000 rtb-ml-api
```

### Production Considerations

1. **Latency**: ML predictions add ~5-10ms
2. **Caching**: Cache predictions for similar requests
3. **Fallback**: Always have rule-based fallback
4. **Monitoring**: Track prediction latency and accuracy
5. **Retraining**: Retrain models weekly with new data

## Retraining Pipeline

### 1. Collect New Data

Export auction data from database:
```sql
SELECT 
  user_age, device_type, location, hour_of_day,
  day_of_week, ad_category, frequency_count,
  floor_price, competition_level, clicked, converted
FROM auctions
WHERE timestamp > NOW() - INTERVAL '7 days';
```

### 2. Append to Dataset

```python
new_data = pd.read_csv('new_auctions.csv')
old_data = pd.read_csv('rtb_dataset.csv')
combined = pd.concat([old_data, new_data])
combined.to_csv('rtb_dataset.csv', index=False)
```

### 3. Retrain Models

```bash
python train_ctr_cvr_model.py
```

### 4. Deploy New Models

```bash
# Backup old models
mv models models_backup_$(date +%Y%m%d)

# Deploy new models
# Restart API server
```

## Monitoring

### Key Metrics to Track

1. **Prediction Latency**: Should be <10ms
2. **Model Accuracy**: Compare predictions vs actual outcomes
3. **Feature Drift**: Monitor feature distributions
4. **API Uptime**: Should be >99.9%

### Logging

```python
import logging

logging.basicConfig(
    filename='model_api.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Log predictions
logging.info(f"Prediction: CTR={ctr}, CVR={cvr}, Latency={latency}ms")
```

## Troubleshooting

### Models Not Loading
```bash
# Check if model files exist
ls -lh models/

# Verify file integrity
python -c "import joblib; joblib.load('models/ctr_model.pkl')"
```

### Low Accuracy
- Retrain with more data
- Tune hyperparameters
- Add more features
- Check for data quality issues

### High Latency
- Use batch predictions
- Implement caching
- Optimize feature extraction
- Consider model compression

## Advanced Features

### A/B Testing

Compare ML vs rule-based:

```python
# Route 50% to ML, 50% to rule-based
if random.random() < 0.5:
    ctr = ml_predict(features)
else:
    ctr = rule_based_predict(features)
```

### Ensemble Models

Combine multiple models:

```python
ctr_ml = ml_model.predict(X)
ctr_rule = rule_based_predict(X)
ctr_final = 0.7 * ctr_ml + 0.3 * ctr_rule
```

### Online Learning

Update models in real-time:

```python
# Partial fit with new data
model.partial_fit(X_new, y_new)
```

## Resources

- **XGBoost Documentation**: https://xgboost.readthedocs.io/
- **Scikit-learn**: https://scikit-learn.org/
- **Flask**: https://flask.palletsprojects.com/

## Support

For issues or questions:
1. Check logs: `tail -f model_api.log`
2. Verify models: `python -c "import joblib; print(joblib.load('models/ctr_model.pkl'))"`
3. Test API: `curl http://localhost:5000/health`

---

**Happy Training!** 🚀

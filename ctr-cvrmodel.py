"""
RTB DSP CTR/CVR Model Training
Train XGBoost models for click and conversion prediction
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, log_loss, confusion_matrix
)
import joblib
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns


class CTRCVRModelTrainer:
    """Train and evaluate CTR/CVR prediction models"""
    
    def __init__(self, data_path='rtb_dataset.csv'):
        self.data_path = data_path
        self.ctr_model = None
        self.cvr_model = None
        self.feature_columns = None
        self.metrics = {}
    
    def load_data(self):
        """Load and prepare dataset"""
        print("Loading dataset...")
        df = pd.read_csv(self.data_path)
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        print(f"Loaded {len(df)} samples")
        print(f"Click rate: {df['clicked'].mean()*100:.2f}%")
        print(f"Conversion rate: {df['converted'].sum()/df['clicked'].sum()*100:.2f}%")
        
        return df
    
    def prepare_features(self, df):
        """Prepare features for training"""
        # Feature columns (exclude labels and metadata)
        feature_cols = [
            'user_age', 'device_type', 'location', 'hour_of_day',
            'day_of_week', 'ad_category', 'frequency_count',
            'floor_price', 'competition_level', 'is_weekend',
            'is_peak_hour', 'is_mobile'
        ]
        
        self.feature_columns = feature_cols
        
        X = df[feature_cols]
        y_ctr = df['clicked']
        y_cvr = df['converted']
        
        return X, y_ctr, y_cvr
    
    def train_ctr_model(self, X_train, y_train, X_val, y_val):
        """Train CTR prediction model"""
        print("\n" + "="*60)
        print("TRAINING CTR MODEL")
        print("="*60)
        
        # XGBoost parameters
        params = {
            'objective': 'binary:logistic',
            'eval_metric': ['logloss', 'auc'],
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'tree_method': 'hist',
        }
        
        # Train model
        self.ctr_model = xgb.XGBClassifier(**params)
        
        eval_set = [(X_train, y_train), (X_val, y_val)]
        self.ctr_model.fit(
            X_train, y_train,
            eval_set=eval_set,
            verbose=10
        )
        
        # Predictions
        y_pred_proba = self.ctr_model.predict_proba(X_val)[:, 1]
        y_pred = (y_pred_proba >= 0.5).astype(int)
        
        # Metrics
        metrics = {
            'accuracy': accuracy_score(y_val, y_pred),
            'precision': precision_score(y_val, y_pred),
            'recall': recall_score(y_val, y_pred),
            'f1_score': f1_score(y_val, y_pred),
            'auc': roc_auc_score(y_val, y_pred_proba),
            'log_loss': log_loss(y_val, y_pred_proba),
        }
        
        self.metrics['ctr'] = metrics
        
        print("\nCTR Model Performance:")
        for metric, value in metrics.items():
            print(f"  {metric}: {value:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.ctr_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 5 Important Features:")
        print(feature_importance.head())
        
        return metrics, feature_importance
    
    def train_cvr_model(self, X_train, y_train, X_val, y_val):
        """Train CVR prediction model"""
        print("\n" + "="*60)
        print("TRAINING CVR MODEL")
        print("="*60)
        
        # Filter only clicked samples for CVR
        clicked_train = y_train > 0
        clicked_val = y_val > 0
        
        if clicked_train.sum() == 0 or clicked_val.sum() == 0:
            print("Not enough clicked samples for CVR training")
            return None, None
        
        X_train_cvr = X_train[clicked_train]
        y_train_cvr = y_train[clicked_train]
        X_val_cvr = X_val[clicked_val]
        y_val_cvr = y_val[clicked_val]
        
        print(f"Training on {len(X_train_cvr)} clicked samples")
        print(f"Validation on {len(X_val_cvr)} clicked samples")
        
        # XGBoost parameters
        params = {
            'objective': 'binary:logistic',
            'eval_metric': ['logloss', 'auc'],
            'max_depth': 5,
            'learning_rate': 0.1,
            'n_estimators': 150,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'tree_method': 'hist',
        }
        
        # Train model
        self.cvr_model = xgb.XGBClassifier(**params)
        
        eval_set = [(X_train_cvr, y_train_cvr), (X_val_cvr, y_val_cvr)]
        self.cvr_model.fit(
            X_train_cvr, y_train_cvr,
            eval_set=eval_set,
            verbose=10
        )
        
        # Predictions
        y_pred_proba = self.cvr_model.predict_proba(X_val_cvr)[:, 1]
        y_pred = (y_pred_proba >= 0.5).astype(int)
        
        # Metrics
        metrics = {
            'accuracy': accuracy_score(y_val_cvr, y_pred),
            'precision': precision_score(y_val_cvr, y_pred),
            'recall': recall_score(y_val_cvr, y_pred),
            'f1_score': f1_score(y_val_cvr, y_pred),
            'auc': roc_auc_score(y_val_cvr, y_pred_proba),
            'log_loss': log_loss(y_val_cvr, y_pred_proba),
        }
        
        self.metrics['cvr'] = metrics
        
        print("\nCVR Model Performance:")
        for metric, value in metrics.items():
            print(f"  {metric}: {value:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.cvr_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 5 Important Features:")
        print(feature_importance.head())
        
        return metrics, feature_importance
    
    def save_models(self, output_dir='models'):
        """Save trained models"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Save models
        joblib.dump(self.ctr_model, f'{output_dir}/ctr_model.pkl')
        joblib.dump(self.cvr_model, f'{output_dir}/cvr_model.pkl')
        
        # Save feature columns
        with open(f'{output_dir}/feature_columns.json', 'w') as f:
            json.dump(self.feature_columns, f)
        
        # Save metrics
        with open(f'{output_dir}/metrics.json', 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        print(f"\nModels saved to {output_dir}/")
    
    def plot_feature_importance(self, ctr_importance, cvr_importance):
        """Plot feature importance"""
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # CTR feature importance
        axes[0].barh(ctr_importance['feature'][:10], ctr_importance['importance'][:10])
        axes[0].set_xlabel('Importance')
        axes[0].set_title('CTR Model - Top 10 Features')
        axes[0].invert_yaxis()
        
        # CVR feature importance
        if cvr_importance is not None:
            axes[1].barh(cvr_importance['feature'][:10], cvr_importance['importance'][:10])
            axes[1].set_xlabel('Importance')
            axes[1].set_title('CVR Model - Top 10 Features')
            axes[1].invert_yaxis()
        
        plt.tight_layout()
        plt.savefig('models/feature_importance.png', dpi=300, bbox_inches='tight')
        print("Feature importance plot saved to models/feature_importance.png")
    
    def train(self):
        """Main training pipeline"""
        # Load data
        df = self.load_data()
        
        # Prepare features
        X, y_ctr, y_cvr = self.prepare_features(df)
        
        # Split data
        X_train, X_val, y_ctr_train, y_ctr_val, y_cvr_train, y_cvr_val = train_test_split(
            X, y_ctr, y_cvr, test_size=0.2, random_state=42, stratify=y_ctr
        )
        
        print(f"\nTraining set: {len(X_train)} samples")
        print(f"Validation set: {len(X_val)} samples")
        
        # Train CTR model
        ctr_metrics, ctr_importance = self.train_ctr_model(
            X_train, y_ctr_train, X_val, y_ctr_val
        )
        
        # Train CVR model
        cvr_metrics, cvr_importance = self.train_cvr_model(
            X_train, y_cvr_train, X_val, y_cvr_val
        )
        
        # Save models
        self.save_models()
        
        # Plot feature importance
        self.plot_feature_importance(ctr_importance, cvr_importance)
        
        # Generate report
        self.generate_report()
        
        print("\n" + "="*60)
        print("TRAINING COMPLETE!")
        print("="*60)
        print("\nModels saved to models/")
        print("  - ctr_model.pkl")
        print("  - cvr_model.pkl")
        print("  - feature_columns.json")
        print("  - metrics.json")
        print("  - training_report.txt")
    
    def generate_report(self):
        """Generate training report"""
        with open('models/training_report.txt', 'w') as f:
            f.write("RTB DSP Model Training Report\n")
            f.write("="*60 + "\n\n")
            f.write(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Dataset: {self.data_path}\n\n")
            
            f.write("CTR Model Performance:\n")
            f.write("-"*40 + "\n")
            for metric, value in self.metrics['ctr'].items():
                f.write(f"  {metric}: {value:.4f}\n")
            
            f.write("\nCVR Model Performance:\n")
            f.write("-"*40 + "\n")
            for metric, value in self.metrics['cvr'].items():
                f.write(f"  {metric}: {value:.4f}\n")
            
            f.write("\nFeatures Used:\n")
            f.write("-"*40 + "\n")
            for feature in self.feature_columns:
                f.write(f"  - {feature}\n")
        
        print("Training report saved to models/training_report.txt")


def main():
    """Main training script"""
    print("="*60)
    print("RTB DSP CTR/CVR Model Training")
    print("="*60)
    
    # Initialize trainer
    trainer = CTRCVRModelTrainer(data_path='rtb_dataset.csv')
    
    # Train models
    trainer.train()


if __name__ == "__main__":
    main()

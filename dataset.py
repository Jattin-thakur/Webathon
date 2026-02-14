"""
RTB DSP Dataset Generator
Generates synthetic training data for CTR/CVR prediction models
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)


class RTBDatasetGenerator:
    """Generate realistic RTB auction data for training"""
    
    def __init__(self, num_samples=100000):
        self.num_samples = num_samples
        
        # Device performance baselines
        self.device_ctr = {0: 0.052, 1: 0.038, 2: 0.045}  # Desktop, Mobile, Tablet
        self.device_cvr = {0: 0.028, 1: 0.015, 2: 0.022}
        
        # Category performance baselines
        self.category_ctr = {
            0: 0.055,  # Electronics
            1: 0.048,  # Fashion
            2: 0.032,  # Auto
            3: 0.072,  # Gaming
            4: 0.041,  # SaaS
            5: 0.062,  # Fitness
            6: 0.058,  # Travel
            7: 0.068,  # Food
            8: 0.029,  # Finance
            9: 0.044,  # Health
        }
        
        self.category_cvr = {
            0: 0.025, 1: 0.032, 2: 0.018, 3: 0.042, 4: 0.035,
            5: 0.028, 6: 0.022, 7: 0.038, 8: 0.015, 9: 0.020,
        }
    
    def get_time_multiplier(self, hour):
        """Time of day engagement multiplier"""
        if 9 <= hour <= 11:
            return 1.25  # Morning peak
        elif 12 <= hour <= 14:
            return 1.15  # Lunch peak
        elif 18 <= hour <= 21:
            return 1.30  # Evening peak
        elif hour >= 22 or hour <= 5:
            return 0.65  # Late night
        return 1.0
    
    def get_frequency_decay(self, count):
        """Ad fatigue based on frequency"""
        if count == 0:
            return 1.0
        elif count <= 2:
            return 0.90
        elif count <= 5:
            return 0.70
        elif count <= 10:
            return 0.45
        return 0.20
    
    def get_age_multiplier(self, age):
        """Age bracket performance"""
        if 18 <= age <= 24:
            return {'ctr': 1.15, 'cvr': 0.85}
        elif 25 <= age <= 34:
            return {'ctr': 1.10, 'cvr': 1.20}
        elif 35 <= age <= 44:
            return {'ctr': 1.00, 'cvr': 1.15}
        elif 45 <= age <= 54:
            return {'ctr': 0.90, 'cvr': 1.05}
        return {'ctr': 0.80, 'cvr': 0.95}
    
    def get_geo_multiplier(self, location):
        """Geographic performance variance"""
        geo_factors = {
            0: 1.10, 1: 1.05, 2: 0.95, 3: 1.15, 4: 0.90,
            5: 1.20, 6: 0.85, 7: 1.00, 8: 1.08, 9: 0.92,
        }
        return geo_factors.get(location, 1.0)
    
    def calculate_ctr(self, features):
        """Calculate true CTR based on features"""
        device = features['device_type']
        category = features['ad_category']
        hour = features['hour_of_day']
        freq = features['frequency_count']
        age = features['user_age']
        location = features['location']
        
        base_ctr = self.device_ctr[device]
        category_factor = self.category_ctr[category] / 0.04
        time_factor = self.get_time_multiplier(hour)
        freq_factor = self.get_frequency_decay(freq)
        age_factor = self.get_age_multiplier(age)['ctr']
        geo_factor = self.get_geo_multiplier(location)
        
        ctr = base_ctr * category_factor * time_factor * freq_factor * age_factor * geo_factor
        
        # Add noise
        noise = np.random.normal(0, 0.005)
        ctr = max(0.001, min(0.99, ctr + noise))
        
        return ctr
    
    def calculate_cvr(self, features, clicked):
        """Calculate true CVR based on features"""
        if not clicked:
            return 0.0
        
        device = features['device_type']
        category = features['ad_category']
        freq = features['frequency_count']
        age = features['user_age']
        location = features['location']
        
        base_cvr = self.device_cvr[device]
        category_factor = self.category_cvr[category] / 0.02
        freq_factor = self.get_frequency_decay(freq)
        age_factor = self.get_age_multiplier(age)['cvr']
        geo_factor = self.get_geo_multiplier(location)
        
        cvr = base_cvr * category_factor * freq_factor * age_factor * geo_factor
        
        # Add noise
        noise = np.random.normal(0, 0.003)
        cvr = max(0.001, min(0.99, cvr + noise))
        
        return cvr
    
    def generate_dataset(self):
        """Generate complete dataset"""
        print(f"Generating {self.num_samples} samples...")
        
        data = []
        start_date = datetime.now() - timedelta(days=90)
        
        for i in range(self.num_samples):
            # Generate features
            timestamp = start_date + timedelta(
                seconds=random.randint(0, 90 * 24 * 3600)
            )
            
            features = {
                'timestamp': timestamp,
                'user_age': random.randint(18, 65),
                'device_type': random.choices([0, 1, 2], weights=[0.3, 0.5, 0.2])[0],
                'location': random.randint(0, 9),
                'hour_of_day': timestamp.hour,
                'day_of_week': timestamp.weekday(),
                'ad_category': random.randint(0, 9),
                'frequency_count': random.choices(
                    range(15), 
                    weights=[0.3, 0.25, 0.15, 0.1, 0.08, 0.05, 0.03, 0.02, 0.01, 0.005, 0.003, 0.002, 0.001, 0.0005, 0.0005]
                )[0],
                'floor_price': round(random.uniform(0.5, 3.0), 2),
                'competition_level': random.choices([0, 1, 2, 3, 4], weights=[0.1, 0.2, 0.4, 0.2, 0.1])[0],
            }
            
            # Calculate true CTR and CVR
            true_ctr = self.calculate_ctr(features)
            
            # Simulate click (Bernoulli trial)
            clicked = np.random.random() < true_ctr
            
            # Calculate CVR only if clicked
            true_cvr = self.calculate_cvr(features, clicked)
            
            # Simulate conversion (Bernoulli trial)
            converted = clicked and (np.random.random() < true_cvr)
            
            # Add labels
            features['clicked'] = int(clicked)
            features['converted'] = int(converted)
            features['true_ctr'] = true_ctr
            features['true_cvr'] = true_cvr if clicked else 0.0
            
            data.append(features)
            
            if (i + 1) % 10000 == 0:
                print(f"Generated {i + 1}/{self.num_samples} samples...")
        
        df = pd.DataFrame(data)
        
        # Add derived features
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_peak_hour'] = df['hour_of_day'].isin([9, 10, 11, 12, 13, 14, 18, 19, 20, 21]).astype(int)
        df['is_mobile'] = (df['device_type'] == 1).astype(int)
        
        print(f"\nDataset generated successfully!")
        print(f"Total samples: {len(df)}")
        print(f"Clicks: {df['clicked'].sum()} ({df['clicked'].mean()*100:.2f}%)")
        print(f"Conversions: {df['converted'].sum()} ({df['converted'].sum()/df['clicked'].sum()*100:.2f}% of clicks)")
        
        return df


def main():
    """Generate and save dataset"""
    # Generate dataset
    generator = RTBDatasetGenerator(num_samples=100000)
    df = generator.generate_dataset()
    
    # Save to CSV
    output_file = 'rtb_dataset.csv'
    df.to_csv(output_file, index=False)
    print(f"\nDataset saved to {output_file}")
    
    # Display statistics
    print("\n" + "="*60)
    print("DATASET STATISTICS")
    print("="*60)
    print(f"\nShape: {df.shape}")
    print(f"\nFeatures: {list(df.columns)}")
    print(f"\nClick Rate (CTR): {df['clicked'].mean()*100:.2f}%")
    print(f"Conversion Rate (CVR): {df['converted'].sum()/df['clicked'].sum()*100:.2f}%")
    print(f"\nDevice Distribution:")
    print(df['device_type'].value_counts(normalize=True) * 100)
    print(f"\nCategory Distribution:")
    print(df['ad_category'].value_counts(normalize=True) * 100)
    
    # Save summary
    with open('dataset_summary.txt', 'w') as f:
        f.write("RTB Dataset Summary\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total Samples: {len(df)}\n")
        f.write(f"Features: {len(df.columns)}\n")
        f.write(f"Click Rate: {df['clicked'].mean()*100:.2f}%\n")
        f.write(f"Conversion Rate: {df['converted'].sum()/df['clicked'].sum()*100:.2f}%\n")
        f.write(f"\nFeature List:\n")
        for col in df.columns:
            f.write(f"  - {col}\n")
    
    print("\nSummary saved to dataset_summary.txt")


if __name__ == "__main__":
    main()

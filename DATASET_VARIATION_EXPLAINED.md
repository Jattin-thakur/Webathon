# How Dataset Varies in RTB DSP System

## Overview
Your system has TWO types of datasets that vary in different ways:
1. **Live Streaming Data** (Real-time dashboard)
2. **Python ML Training Dataset** (Machine learning models)

---

## 1. LIVE STREAMING DATA (Real-time Dashboard)

### Variation Every Second
The live data stream generates **3-8 new bids per second** with random variations:

#### Bid Price Variation
```
Range: $0.50 - $4.00
Formula: 0.5 + Math.random() * 3.5
Example: $1.23, $2.87, $0.95, $3.42
```

#### Win Rate Variation
```
Probability: 60% chance to win
Formula: Math.random() > 0.4
Result: Each bid randomly wins or loses
```

#### Win Price Variation
```
Range: 70-100% of bid price
Formula: bidPrice * (0.7 + Math.random() * 0.3)
Example: If bid=$2.00, win price=$1.40-$2.00
```

#### CTR (Click-Through Rate) Variation
```
Range: 2% - 8%
Formula: 0.02 + Math.random() * 0.06
Example: 2.5%, 5.3%, 7.1%, 3.8%
```

#### Device Distribution (Random)
- Desktop: 33% chance
- Mobile: 33% chance
- Tablet: 33% chance

#### Category Distribution (Random)
10 categories with equal probability:
- Electronics, Fashion, Auto, Gaming, SaaS
- Fitness, Travel, Food, Finance, Health

### Hourly Variation (Historical Data)
Past hours show different activity levels:

**Last 8 hours (Recent):**
```
Bids: 50-200 per hour
Win Rate: 55-70%
Activity: HIGH
```

**8-16 hours ago (Moderate):**
```
Bids: 20-100 per hour
Win Rate: 50-70%
Activity: MEDIUM
```

**16-24 hours ago (Old):**
```
Bids: 5-35 per hour
Win Rate: 50-70%
Activity: LOW
```

### Click & Conversion Variation
```
Click Chance: 3x CTR (max 50%)
Example: If CTR=5%, click chance=15%

Conversion Rate: 70% of clicks
Example: 100 clicks → 70 conversions
```

---

## 2. PYTHON ML TRAINING DATASET

### 100,000 Samples with Complex Variations

#### Device Performance Baseline
```
Desktop:  CTR=5.2%, CVR=2.8%
Mobile:   CTR=3.8%, CVR=1.5%
Tablet:   CTR=4.5%, CVR=2.2%
```

#### Category Performance Baseline
```
Gaming:      CTR=7.2%, CVR=4.2% (BEST)
Food:        CTR=6.8%, CVR=3.8%
Fitness:     CTR=6.2%, CVR=2.8%
Travel:      CTR=5.8%, CVR=2.2%
Electronics: CTR=5.5%, CVR=2.5%
Fashion:     CTR=4.8%, CVR=3.2%
Health:      CTR=4.4%, CVR=2.0%
SaaS:        CTR=4.1%, CVR=3.5%
Auto:        CTR=3.2%, CVR=1.8%
Finance:     CTR=2.9%, CVR=1.5% (WORST)
```

#### Time of Day Multiplier
```
Morning Peak (9-11 AM):   1.25x engagement
Lunch Peak (12-2 PM):     1.15x engagement
Evening Peak (6-9 PM):    1.30x engagement (BEST)
Late Night (10 PM-5 AM):  0.65x engagement (WORST)
Normal Hours:             1.0x engagement
```

#### Frequency/Ad Fatigue Effect
```
First View (0):     100% effectiveness
2nd-3rd View:       90% effectiveness
4th-5th View:       70% effectiveness
6th-10th View:      45% effectiveness
11+ Views:          20% effectiveness (Ad fatigue!)
```

#### Age Bracket Multipliers
```
18-24 years: CTR=1.15x, CVR=0.85x (High clicks, low conversion)
25-34 years: CTR=1.10x, CVR=1.20x (BEST converters)
35-44 years: CTR=1.00x, CVR=1.15x (Good balance)
45-54 years: CTR=0.90x, CVR=1.05x
55+ years:   CTR=0.80x, CVR=0.95x (Low engagement)
```

#### Geographic Multipliers
```
Location 5: 1.20x (BEST market)
Location 3: 1.15x
Location 0: 1.10x
Location 8: 1.08x
Location 1: 1.05x
Location 7: 1.00x
Location 2: 0.95x
Location 9: 0.92x
Location 4: 0.90x
Location 6: 0.85x (WORST market)
```

#### Competition Level
```
Level 0 (Very Low):  10% of auctions
Level 1 (Low):       20% of auctions
Level 2 (Medium):    40% of auctions (Most common)
Level 3 (High):      20% of auctions
Level 4 (Very High): 10% of auctions
```

#### Floor Price Variation
```
Range: $0.50 - $3.00
Distribution: Uniform random
Example: $0.87, $1.45, $2.23, $2.91
```

### Final CTR/CVR Calculation Formula

**CTR Calculation:**
```
CTR = base_device_ctr 
    × category_factor 
    × time_multiplier 
    × frequency_decay 
    × age_factor 
    × geo_factor 
    + random_noise(-0.005 to +0.005)
```

**CVR Calculation (only if clicked):**
```
CVR = base_device_cvr 
    × category_factor 
    × frequency_decay 
    × age_factor 
    × geo_factor 
    + random_noise(-0.003 to +0.003)
```

### Example Variation Scenarios

**Scenario 1: BEST Performance**
```
Device: Desktop (5.2% base CTR)
Category: Gaming (7.2% base CTR)
Time: 8 PM (1.30x multiplier)
Frequency: First view (1.0x)
Age: 25-34 (1.10x CTR, 1.20x CVR)
Location: Location 5 (1.20x)

Expected CTR: ~15-20%
Expected CVR: ~8-12%
```

**Scenario 2: WORST Performance**
```
Device: Mobile (3.8% base CTR)
Category: Finance (2.9% base CTR)
Time: 3 AM (0.65x multiplier)
Frequency: 15th view (0.20x - ad fatigue!)
Age: 55+ (0.80x CTR, 0.95x CVR)
Location: Location 6 (0.85x)

Expected CTR: ~0.5-1%
Expected CVR: ~0.2-0.5%
```

**Scenario 3: AVERAGE Performance**
```
Device: Tablet (4.5% base CTR)
Category: Fashion (4.8% base CTR)
Time: 2 PM (1.15x multiplier)
Frequency: 3rd view (0.90x)
Age: 35-44 (1.00x CTR, 1.15x CVR)
Location: Location 7 (1.00x)

Expected CTR: ~5-6%
Expected CVR: ~3-4%
```

---

## Key Differences Between Live vs Training Data

| Aspect | Live Streaming | ML Training Dataset |
|--------|---------------|---------------------|
| **Purpose** | Real-time dashboard | Model training |
| **Size** | Continuous (3-8/sec) | 100,000 samples |
| **Variation** | Simple random | Complex multi-factor |
| **Factors** | 5 variables | 15+ variables |
| **Realism** | Basic simulation | Highly realistic |
| **Time Range** | Last 24 hours | Last 90 days |
| **CTR Range** | 2-8% uniform | 0.5-20% contextual |
| **CVR Logic** | Simple 70% rate | Complex conditional |

---

## Summary

**Live Data varies by:**
- Random bid prices ($0.50-$4.00)
- Random win/loss (60% win rate)
- Random device & category selection
- Time-based historical patterns
- Simple click/conversion simulation

**Training Data varies by:**
- Device type performance
- Category performance
- Time of day patterns
- Ad frequency fatigue
- User age demographics
- Geographic location
- Competition levels
- Complex interaction effects
- Realistic noise injection

The training dataset is much more sophisticated and realistic, while the live data focuses on real-time visualization with simpler variation patterns.

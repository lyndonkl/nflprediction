# Options Trading: Fundamental Tools and Variables

## Overview

**Purpose**: Foundational understanding of options mechanics - the "tools" you have available
**Analogy**: Like understanding physics before engineering - these are the fundamental forces that govern all options behavior
**Source**: Adapted from "Mastering Options: A Strategic Blueprint for Disciplined Trading"

---

## Table of Contents

1. [The Core Contract: Rights vs Obligations](#the-core-contract-rights-vs-obligations)
2. [The Three Essential Variables](#the-three-essential-variables)
3. [Intrinsic vs Extrinsic Value](#intrinsic-vs-extrinsic-value)
4. [The Greeks: Your Risk Dashboard](#the-greeks-your-risk-dashboard)
5. [Greeks Intuition Cheat Sheet](#greeks-intuition-cheat-sheet)
6. [Application to Prediction Markets](#application-to-prediction-markets)

---

## The Core Contract: Rights vs Obligations

### The Fundamental Asymmetry

Options are defined by one critical characteristic: **the right, but not the obligation**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTIONS: THE ASYMMETRY OF RISK                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   BUYER (Long)                        SELLER (Short/Writer)                │
│   ════════════                        ═══════════════════                  │
│                                                                             │
│   • Pays premium upfront              • Receives premium upfront           │
│   • Has RIGHT to exercise             • Has OBLIGATION if exercised        │
│   • Max loss = Premium paid           • Max gain = Premium received        │
│   • Max gain = Unlimited (calls)      • Max loss = Unlimited (naked calls) │
│                 or substantial (puts)            or substantial (puts)     │
│                                                                             │
│   RISK PROFILE:                       RISK PROFILE:                        │
│   Limited downside                    Limited upside                       │
│   Unlimited upside                    Potentially unlimited downside       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Call Options

**Definition**: The right to BUY an underlying asset at a specified price (strike) by a specified date (expiry).

| Perspective | Market View | Max Gain | Max Loss |
|-------------|-------------|----------|----------|
| **Long Call** (Buyer) | Bullish | Unlimited | Premium paid |
| **Short Call** (Seller) | Neutral/Bearish | Premium received | Unlimited |

**Mental Model**: Buying a call is like paying a deposit to lock in a purchase price. If the asset skyrockets, you buy at the locked price. If it doesn't, you just lose your deposit.

### Put Options

**Definition**: The right to SELL an underlying asset at a specified price (strike) by a specified date (expiry).

| Perspective | Market View | Max Gain | Max Loss |
|-------------|-------------|----------|----------|
| **Long Put** (Buyer) | Bearish | Strike - Premium (substantial) | Premium paid |
| **Short Put** (Seller) | Bullish/Neutral | Premium received | Strike - Premium (substantial) |

**Mental Model**: Buying a put is like buying insurance. You pay a premium to protect against the asset's price falling below a certain level.

---

## The Three Essential Variables

Every option contract is defined by three fundamental variables:

### 1. Strike Price (K)

The predetermined price at which the underlying can be bought/sold.

```
Strike Price Relationship to Current Price:

                    Current Stock Price: $100
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         │                         ▼
  Strike $90              Strike $100              Strike $110
    │                         │                         │
    │                         │                         │
    ▼                         ▼                         ▼

FOR CALLS:                FOR CALLS:              FOR CALLS:
  ITM (In-the-Money)        ATM (At-the-Money)      OTM (Out-of-the-Money)
  Has intrinsic value       Highest extrinsic       All extrinsic value
  Delta ≈ 0.7-0.9           Delta ≈ 0.50            Delta ≈ 0.1-0.3

FOR PUTS:                 FOR PUTS:               FOR PUTS:
  OTM (Out-of-the-Money)    ATM (At-the-Money)      ITM (In-the-Money)
  All extrinsic value       Highest extrinsic       Has intrinsic value
  Delta ≈ -0.1 to -0.3      Delta ≈ -0.50           Delta ≈ -0.7 to -0.9
```

### 2. Expiration Date (T)

The deadline by which the option must be exercised or it becomes worthless.

**Key Insight**: Time works against option buyers and for option sellers.

```
Time Value Decay (Theta) Acceleration:

  Value │
        │████
        │████████
        │████████████
        │████████████████
        │████████████████████
        │████████████████████████████
        └─────────────────────────────────────▶ Time
         90 days        45 days        Expiration
                              │
                              └─ Decay accelerates here
                                 (final 30-45 days)
```

### 3. Premium (P)

The price paid for the option contract.

**Important**: One standard contract = 100 shares. A $5 premium = $500 total cost.

```
Premium = Intrinsic Value + Extrinsic Value

Example: Stock at $105, Call with $100 strike, Premium = $8

  Intrinsic Value = $105 - $100 = $5 (immediate exercise profit)
  Extrinsic Value = $8 - $5 = $3 (time + volatility premium)
```

---

## Intrinsic vs Extrinsic Value

### Intrinsic Value: The "Real" Worth

**Definition**: The profit you'd get if you exercised the option RIGHT NOW.

```python
# Intrinsic Value Calculations
def intrinsic_value_call(stock_price, strike):
    return max(stock_price - strike, 0)

def intrinsic_value_put(stock_price, strike):
    return max(strike - stock_price, 0)

# Examples
call_intrinsic = intrinsic_value_call(105, 100)  # = $5
put_intrinsic = intrinsic_value_put(105, 100)    # = $0 (OTM)
```

### Extrinsic Value: The "Hope" Premium

**Definition**: The portion of premium above intrinsic value - what traders pay for the *possibility* of favorable movement.

**Three Drivers of Extrinsic Value**:

| Factor | Higher Value When... | Intuition |
|--------|---------------------|-----------|
| **Time to Expiry** | More time remaining | More time = more opportunity for favorable movement |
| **Implied Volatility** | Higher IV | Greater expected price swings = options worth more |
| **Interest Rates** | Higher rates (calls) | Opportunity cost of capital |

```
Extrinsic Value Decomposition:

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    EXTRINSIC VALUE = Time Value + Volatility Premium            │
│                                                                 │
│    Time Value:                                                  │
│    • Decays every day (Theta)                                   │
│    • Highest for ATM options                                    │
│    • Accelerates near expiration                                │
│                                                                 │
│    Volatility Premium:                                          │
│    • Based on implied volatility (IV)                           │
│    • Higher IV = higher premium                                 │
│    • Can expand or contract (Vega sensitivity)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Critical Insight for Buyers vs Sellers

```
FOR OPTION BUYERS:
  • You're paying for extrinsic value that DECAYS daily
  • Being right about direction is NOT enough
  • You must be right about direction, magnitude, AND timing
  • Time is your enemy

FOR OPTION SELLERS:
  • You're collecting extrinsic value that DECAYS in your favor
  • Time decay (Theta) is your friend
  • You can profit even if direction is wrong (as long as within range)
  • Time is your ally
```

---

## The Greeks: Your Risk Dashboard

The Greeks are sensitivity measures - they tell you how your option's price will change in response to different factors.

**Mental Model**: Think of them as warning lights on a car dashboard. Each one monitors a different risk dimension.

### Delta (Δ): Directional Exposure

**What it measures**: How much the option price changes for a $1 move in the underlying.

```
Delta Intuition:

  CALLS: Delta ranges from 0 to +1.00
  ┌─────────────────────────────────────────────────────────────┐
  │  Deep OTM        ATM           Deep ITM                     │
  │    ~0.05         ~0.50          ~0.95                        │
  │      │             │              │                          │
  │      │   (Low      │   (Moves     │   (Behaves almost        │
  │      │ sensitivity)│  ~$0.50 per  │    like stock)           │
  │      │             │   $1 stock   │                          │
  │      │             │    move)     │                          │
  └─────────────────────────────────────────────────────────────┘

  PUTS: Delta ranges from -1.00 to 0
  ┌─────────────────────────────────────────────────────────────┐
  │  Deep ITM        ATM           Deep OTM                     │
  │   ~-0.95        ~-0.50         ~-0.05                        │
  │      │             │              │                          │
  │      │  (Behaves   │   (Moves     │   (Low                   │
  │      │almost like  │  ~$0.50 per  │  sensitivity)            │
  │      │short stock) │   $1 stock   │                          │
  │      │             │    move)     │                          │
  └─────────────────────────────────────────────────────────────┘
```

**Three Interpretations of Delta**:

1. **Price Sensitivity**: $0.40 delta = option moves $0.40 for every $1 stock move
2. **Share Equivalency**: 0.40 delta = controlling ~40 shares of stock exposure
3. **Probability Proxy**: 0.40 delta ≈ 40% probability of expiring ITM

### Gamma (Γ): Rate of Delta Change

**What it measures**: How fast Delta changes as the underlying price moves.

```
Gamma as "Acceleration":

  Think of Delta as velocity (how fast you're going)
  Gamma is acceleration (how fast velocity is changing)

  High Gamma = Delta changes rapidly = Position becomes unstable
  Low Gamma = Delta changes slowly = Position is more stable

                    Gamma Profile
                          │
        High Gamma ─────►│█████████
                         │█████████████
                         │█████████████████
        Low Gamma  ─────►│                  ████████
                         └─────────────────────────────────►
                         Deep OTM    ATM    Deep ITM
                                      │
                                      └─ Maximum Gamma at ATM
```

**Key Insight**:
- **Long options** have positive Gamma (your Delta improves as you're right)
- **Short options** have negative Gamma (your Delta worsens as you're wrong - losses accelerate)

### Theta (Θ): Time Decay

**What it measures**: How much value the option loses each day from time passage.

```
Theta Reality Check:

  Example: Option with Theta = -$0.05

  Day 1: Option worth $3.00
  Day 2: Option worth $2.95 (lost $0.05 overnight, all else equal)
  Day 3: Option worth $2.90
  ...and so on

  CRITICAL: Theta accelerates near expiration!

  Days to Expiry:  60    45    30    15    7     1
  Daily Theta:    -$0.03 -$0.04 -$0.06 -$0.10 -$0.20 -$0.50
                                              ▲
                                              │
                                        Theta "burn"
                                        accelerates
```

**The Theta Trap for Buyers**:
- You can be RIGHT about direction but LOSE money
- The stock moves up $2, but your call only gains $0.80 because it lost $1.20 to time decay
- Solution: Account for Theta in your profit targets

### Vega (V): Volatility Sensitivity

**What it measures**: How much the option price changes for a 1% change in implied volatility.

```
Vega and Implied Volatility:

  Implied Volatility (IV) = Market's expectation of future price swings

  High IV:
  • Options are EXPENSIVE
  • Market expects big moves
  • Common before earnings, major events
  • Buying options = overpaying if IV drops

  Low IV:
  • Options are CHEAP
  • Market expects calm
  • Common after events resolve
  • Buying options = bargains if IV rises

  IV CRUSH:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  IV Before Earnings: 60%  ────► IV After Earnings: 30%     │
  │                                                            │
  │  Even if stock moves in your direction, your option can    │
  │  LOSE value because IV collapsed!                          │
  │                                                            │
  │  Example:                                                  │
  │  • Buy call at $5.00 when IV = 60%                         │
  │  • Stock goes up $2 (good!)                                │
  │  • But IV drops to 30%                                     │
  │  • Call now worth $4.50 (lost $0.50 despite being right)   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### Rho (ρ): Interest Rate Sensitivity

**What it measures**: How option price changes with interest rate shifts.

**Key Points**:
- Generally minor impact for short-term options
- More significant for LEAPS (long-dated options)
- Higher rates → calls more valuable, puts less valuable
- Often the least important Greek for most traders

---

## Greeks Intuition Cheat Sheet

### Quick Reference Table

| Greek | Symbol | Measures | Long Option | Short Option | Highest For |
|-------|--------|----------|-------------|--------------|-------------|
| **Delta** | Δ | Direction sensitivity | Positive (calls), Negative (puts) | Negative (calls), Positive (puts) | ITM options |
| **Gamma** | Γ | Delta acceleration | Positive | Negative | ATM options |
| **Theta** | Θ | Time decay | Negative (hurts you) | Positive (helps you) | ATM options, near expiry |
| **Vega** | V | Volatility sensitivity | Positive | Negative | ATM options, long-dated |
| **Rho** | ρ | Interest rate sensitivity | Pos (calls), Neg (puts) | Neg (calls), Pos (puts) | Long-dated options |

### Greeks Interaction Mental Model

```
The Greeks Don't Work in Isolation - They Interact:

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  GAMMA affects DELTA:                                                    │
│    High Gamma → Delta changes rapidly with price moves                   │
│    This can accelerate profits OR losses                                 │
│                                                                          │
│  THETA erodes EXTRINSIC VALUE:                                           │
│    Same component that VEGA affects                                      │
│    High Vega position losing to Theta = double drag                      │
│                                                                          │
│  VEGA can override DELTA:                                                │
│    Stock moves in your favor (+$2)                                       │
│    But IV drops 10% (-$1.50 from Vega)                                   │
│    Net: Only +$0.50 despite being right on direction                     │
│                                                                          │
│  Near Expiration:                                                        │
│    Gamma INCREASES (more volatile position)                              │
│    Theta ACCELERATES (time value evaporates)                             │
│    Vega DECREASES (less time for vol to matter)                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### The Four Key Questions Before Any Trade

1. **Delta**: Am I comfortable with my directional exposure?
2. **Gamma**: How will my exposure change if the stock moves?
3. **Theta**: How much am I paying (or receiving) daily for this position?
4. **Vega**: Am I buying expensive options (high IV) or cheap options (low IV)?

---

## Application to Prediction Markets

### Mapping Options Concepts to Prediction Markets

The concepts from options trading map directly to Robinhood prediction markets:

| Options Concept | Prediction Market Equivalent |
|-----------------|------------------------------|
| **Call Option** | YES contract (betting event happens) |
| **Put Option** | NO contract (betting event doesn't happen) |
| **Strike Price** | Fixed at $0 (event either happens or doesn't) |
| **Expiration** | Event resolution date |
| **Premium** | Contract price ($0.01 - $0.99) |
| **Delta** | ≈ 1.00 (price moves 1:1 with probability) |
| **Theta** | Time decay as event approaches |
| **Vega** | Uncertainty premium (volatile events cost more) |

### Key Differences

```
OPTIONS vs PREDICTION MARKETS

SIMILARITY:
  • Both price probability of future outcomes
  • Both have time decay (approaching expiration/event)
  • Both have volatility component

DIFFERENCES:
  ┌────────────────────────────────────────────────────────────────┐
  │ Feature          │ Options          │ Prediction Markets      │
  ├──────────────────┼──────────────────┼─────────────────────────┤
  │ Strike Price     │ Variable         │ Fixed (binary outcome)  │
  │ Payout           │ Variable         │ Fixed ($1 or $0)        │
  │ Delta            │ Variable         │ Effectively 1.00        │
  │ Gamma            │ Variable         │ Not applicable          │
  │ Leverage         │ High             │ Lower (1x)              │
  │ Complex Spreads  │ Many available   │ Limited (combos)        │
  └────────────────────────────────────────────────────────────────┘
```

### Practical Intuition Transfer

**From Options to Prediction Markets**:

1. **Theta Mindset**: Understand that prediction market contracts also decay toward their "true" value as the event approaches - uncertainty premium evaporates.

2. **IV Crush Analog**: Before big games, contract prices reflect maximum uncertainty. After the game starts and information flows, prices converge rapidly - similar to IV crush.

3. **Edge Calculation**: Just like finding mispriced options:
   ```
   Options Edge = Your Probability - Implied Probability (from price)

   Prediction Edge = Your Probability - Contract Price

   If contract at $0.45 and you think 55% probability:
   Edge = 0.55 - 0.45 = 0.10 (10% edge)
   ```

4. **Position Sizing**: Apply the same 1-2% rule - never risk more than 1-2% of capital on a single prediction.

---

## Summary: The Fundamental Tools

### The Five Things You Must Know Before Any Options Trade

1. **What is your maximum loss?** (Premium for buyers, potentially unlimited for naked sellers)

2. **What are you paying for time?** (Theta - daily cost of holding)

3. **What is the probability implied by the price?** (Delta approximation or direct calculation)

4. **Is volatility high or low?** (Vega exposure - are you buying expensive options?)

5. **How will your Greeks change as the position moves?** (Gamma - position stability)

### The Core Mental Model

```
Options = Probability + Time + Volatility

  • Price reflects PROBABILITY of reaching strike
  • Time VALUE decays daily (Theta)
  • VOLATILITY expectations affect what you pay (Vega)
  • DIRECTION matters, but so does MAGNITUDE and TIMING (Delta/Gamma)

The disciplined trader understands that:
  "Being right about direction is necessary but not sufficient.
   You must also be right about timing and volatility."
```

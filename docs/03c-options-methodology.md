# Options Trading: Methodology & Implementation

## Overview

This document bridges **tools** (03a) and **strategy** (03b) with **methodology**—the systematic process of implementing strategies using the Greeks and fundamental concepts as decision-making guides. This is the "craftsman's manual" for actually executing trades.

---

## Part 1: The Implementation Framework

### The Four Phases of Every Trade

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: ANALYSIS          →  What's the opportunity?         │
│  PHASE 2: STRATEGY SELECTION →  Which structure fits?          │
│  PHASE 3: EXECUTION         →  Strike, expiration, size?       │
│  PHASE 4: MANAGEMENT        →  Monitor, adjust, exit?          │
└─────────────────────────────────────────────────────────────────┘
```

Each phase uses different tools from our toolkit.

---

## Part 2: Phase 1 — Analysis Methodology

### Step 1.1: Directional Analysis

**Question**: Where do I think the price is going?

**Method**: Combine technical and fundamental analysis

```
Directional Assessment Checklist:
□ What is the trend (up, down, sideways)?
□ Where are key support/resistance levels?
□ Any upcoming catalysts (earnings, events)?
□ What's the fundamental story?
□ Conviction level: High / Medium / Low
```

**Output**: Bullish / Bearish / Neutral with conviction level

### Step 1.2: Volatility Analysis

**Question**: What's happening with implied volatility?

**Method**: Compare IV to historical volatility and IV rank

```python
# IV Assessment Framework
def assess_iv_environment(current_iv, iv_30d_avg, iv_52w_high, iv_52w_low):
    """
    Assess whether IV is high or low relative to history.
    """
    iv_rank = (current_iv - iv_52w_low) / (iv_52w_high - iv_52w_low) * 100
    iv_percentile_vs_30d = current_iv / iv_30d_avg * 100

    if iv_rank > 70:
        return "HIGH IV - Favor selling premium"
    elif iv_rank < 30:
        return "LOW IV - Favor buying premium"
    else:
        return "NEUTRAL IV - Strategy flexible"
```

**IV Rank Interpretation**:
| IV Rank | Interpretation | Suggested Approach |
|---------|----------------|-------------------|
| 0-30% | Low IV | Buy premium strategies |
| 30-70% | Normal IV | Flexible, slight edge to spreads |
| 70-100% | High IV | Sell premium strategies |

### Step 1.3: Time Horizon Assessment

**Question**: When do I expect my thesis to play out?

**Method**: Match time horizon to expiration selection

```
Time Horizon Guidelines:
┌──────────────────────┬─────────────────────────┐
│ Expected Move In     │ Target Expiration       │
├──────────────────────┼─────────────────────────┤
│ 1-2 weeks            │ 2-4 weeks out           │
│ 2-4 weeks            │ 4-6 weeks out           │
│ 1-2 months           │ 2-3 months out          │
│ 3+ months            │ LEAPS (6-12 months)     │
└──────────────────────┴─────────────────────────┘

Rule: Give yourself 1.5-2x the time you expect to need
```

---

## Part 3: Phase 2 — Strategy Selection Using Greeks

### The Greek-Based Selection Framework

Once you have directional view, IV assessment, and time horizon, use Greeks to refine strategy choice:

#### Delta Strategy Selection

**Your Delta Position = Your Directional Bet**

```
Position Delta Guidelines:
┌────────────────────┬───────────────────────────────┐
│ Market View        │ Target Position Delta         │
├────────────────────┼───────────────────────────────┤
│ Strong Bullish     │ +0.60 to +0.80 per unit risk  │
│ Moderate Bullish   │ +0.30 to +0.50 per unit risk  │
│ Neutral            │ -0.10 to +0.10 per unit risk  │
│ Moderate Bearish   │ -0.30 to -0.50 per unit risk  │
│ Strong Bearish     │ -0.60 to -0.80 per unit risk  │
└────────────────────┴───────────────────────────────┘
```

**How to achieve target delta**:
- **Long call**: Positive delta (choose strike based on delta)
- **Long put**: Negative delta
- **Spread**: Net delta of long minus short leg
- **Straddle**: Near-zero delta (profit from movement, not direction)

#### Theta Strategy Selection

**Theta = Your Relationship with Time**

```
Theta Position Decision Tree:

Are you BUYING or SELLING time?

BUYING TIME (Negative Theta):
├── Use when: Strong directional conviction
├── Expiration: Further out to minimize decay
├── Monitor: Need move before decay eats premium
└── Examples: Long calls, long puts, debit spreads

SELLING TIME (Positive Theta):
├── Use when: Expect range-bound or slow move
├── Expiration: Shorter-term (faster decay)
├── Monitor: Watch for breakouts
└── Examples: Covered calls, credit spreads, iron condors
```

**Theta Targeting by Strategy**:
```python
def theta_strategy_fit(expected_days_to_move, position_theta, premium_at_risk):
    """
    Assess if theta exposure is acceptable.

    Rule: Total theta decay before expected move should be < 30% of position
    """
    estimated_decay = abs(position_theta) * expected_days_to_move
    decay_percent = estimated_decay / premium_at_risk * 100

    if decay_percent > 30:
        return "WARNING: Theta may erode position before thesis plays out"
    else:
        return "ACCEPTABLE: Theta exposure manageable"
```

#### Vega Strategy Selection

**Vega = Your Bet on Volatility Change**

```
Vega Position Matrix:

                      IV OUTLOOK
                      ↑ Will Rise    ↓ Will Fall
VEGA        ──────────────────────────────────────
POSITION    + Long Vega   ✓ Profit      ✗ Loss
            - Short Vega  ✗ Loss        ✓ Profit
```

**When to care about Vega**:
- **High Vega Matters**: Around earnings, FDA decisions, elections
- **Low Vega Matters**: Calm markets, no upcoming catalysts
- **IV Crush Risk**: After events, IV drops → long options lose value even if right on direction

**Vega Strategy Selection**:
```
Before major event (earnings in 2 weeks):
├── IV likely elevated → Short Vega strategies risky
├── Consider: Long options now if IV hasn't spiked
└── Or wait: Sell premium AFTER event during IV crush

After major event just occurred:
├── IV crushing → Long Vega positions hurt
├── Consider: Selling premium, credit spreads
└── Avoid: Buying expensive post-event options
```

#### Gamma Considerations

**Gamma = Rate of Change of Your Directional Bet**

```
Gamma Positioning:

HIGH GAMMA (At-the-money, near expiration):
├── Position delta changes rapidly with price
├── Good for: Quick scalping, day trading
├── Risk: Can quickly go from winner to loser
└── Management: Requires active monitoring

LOW GAMMA (In/out-of-money, longer expiration):
├── Position delta changes slowly
├── Good for: Longer-term directional plays
├── Risk: May not capture enough of the move
└── Management: Less frequent adjustment needed
```

---

## Part 4: Phase 3 — Execution Methodology

### Strike Selection Framework

#### For Long Options (Calls/Puts)

```
Strike Selection Based on Conviction:

HIGH CONVICTION (>70% sure):
└── Buy ATM or slightly ITM
    ├── Higher delta → More participation in move
    ├── Higher cost → More at risk
    └── Lower breakeven requirement

MODERATE CONVICTION (50-70%):
└── Buy ATM strikes
    ├── Balanced delta and cost
    ├── Standard risk/reward
    └── Move needs to cover premium

SPECULATIVE (<50% or small position):
└── Buy OTM strikes
    ├── Lower delta → Needs bigger move
    ├── Lower cost → Less at risk
    └── Lottery ticket profile
```

#### For Spreads

```
Spread Width Selection:

NARROW SPREADS (1-2 strikes wide):
├── Lower max profit
├── Lower max loss
├── Higher probability of profit
└── Use when: Taking many small positions

WIDE SPREADS (3-5+ strikes wide):
├── Higher max profit
├── Higher max loss
├── Lower probability of profit
└── Use when: Strong conviction, fewer positions
```

#### Strike Price Methodology

```python
def select_strike_price(
    stock_price: float,
    direction: str,  # "bullish" or "bearish"
    conviction: str,  # "high", "medium", "low"
    days_to_expiration: int
) -> dict:
    """
    Strike selection methodology.
    """

    # For bullish directional plays
    if direction == "bullish":
        if conviction == "high":
            # ITM call: delta ~0.60-0.70
            strike = stock_price * 0.95  # ~5% ITM
        elif conviction == "medium":
            # ATM call: delta ~0.50
            strike = stock_price  # ATM
        else:
            # OTM call: delta ~0.30
            strike = stock_price * 1.05  # ~5% OTM

    # For bearish directional plays
    elif direction == "bearish":
        if conviction == "high":
            strike = stock_price * 1.05  # ITM put
        elif conviction == "medium":
            strike = stock_price  # ATM
        else:
            strike = stock_price * 0.95  # OTM put

    return {
        "suggested_strike": round(strike),
        "rationale": f"{conviction} conviction {direction} play"
    }
```

### Expiration Selection Framework

```
Expiration Selection Decision Tree:

1. When do you expect the move?
   ├── Add 50-100% buffer time
   └── Example: Expect move in 2 weeks → 3-4 week expiration

2. What's your theta tolerance?
   ├── Buying options: Go further out to reduce decay
   └── Selling options: Go closer in for faster decay

3. Any known catalysts?
   ├── Earnings: Position before or after, not during
   └── Events: Match expiration to event timing

4. Cost considerations:
   ├── Longer expirations = more expensive
   └── Balance cost vs. time buffer
```

### Position Sizing Methodology

```python
def calculate_position_size(
    account_value: float,
    max_risk_percent: float,
    max_loss_per_contract: float
) -> int:
    """
    Calculate number of contracts based on risk management.

    Core Principle: Never risk more than X% of account on single trade
    """
    max_risk_dollars = account_value * (max_risk_percent / 100)
    num_contracts = int(max_risk_dollars / max_loss_per_contract)

    return max(1, num_contracts)  # At least 1 contract

# Example usage:
# Account: $50,000
# Max risk: 2% = $1,000
# Max loss per spread: $200
# Position size: 5 contracts
```

**Position Sizing Rules**:
1. **Single position**: Max 2-5% of account at risk
2. **Correlated positions**: Combined max 10% of account
3. **Total portfolio risk**: Max 20-30% in options at any time
4. **Defined risk only**: For beginners, only trade defined-risk strategies

---

## Part 5: Phase 4 — Management Methodology

### Monitoring Using Greeks

**Daily Greek Check**:
```
Greek Monitoring Checklist:
□ Delta: Is my directional exposure still appropriate?
□ Theta: How much am I losing/gaining per day?
□ Vega: Has IV changed significantly?
□ Position P/L: Where am I vs. plan?
```

### Adjustment Triggers

```
When to Adjust:

DELTA ADJUSTMENT TRIGGERS:
├── Stock moved significantly → Position delta changed
├── Delta now misaligned with view
└── Action: Roll strikes, add/remove legs

THETA ADJUSTMENT TRIGGERS:
├── Approaching expiration
├── Decay accelerating faster than expected
└── Action: Roll to later expiration, close position

VEGA ADJUSTMENT TRIGGERS:
├── IV spiked or crushed unexpectedly
├── Position value changed due to IV, not price
└── Action: Close if thesis was IV-based, hold if directional
```

### Exit Methodology

#### Profit Taking Rules

```
Profit Exit Framework:

DEFINED-RISK TRADES (Spreads, Long Options):
├── Take profit at 50% of max gain for credit spreads
├── Take profit at 50-100% gain for debit spreads
└── Let winners run if thesis still intact

UNDEFINED-RISK TRADES (Covered Calls, Cash-Secured Puts):
├── Take profit at 50% of max premium for short options
├── Roll for more credit if still have same view
└── Close early if view has changed
```

#### Loss Cutting Rules

```
Loss Exit Framework:

ABSOLUTE RULES:
├── Exit at predetermined max loss (set at entry)
├── Never add to losing position to "average down"
└── Exit if thesis is invalidated (regardless of P/L)

RELATIVE RULES:
├── Exit debit spreads if loss reaches 50% of debit paid
├── Exit credit spreads if loss reaches 2x credit received
└── Exit long options if down 50% with no recovery catalyst
```

### Rolling Methodology

```
Rolling Decision Tree:

Is position profitable?
├── YES →
│   ├── Still have same view? → Roll for more profit
│   └── View changed? → Close and reassess
└── NO →
    ├── Thesis still valid? → Roll to extend time
    ├── Thesis invalidated? → Close at loss
    └── Position too large now? → Reduce size, then roll
```

**Rolling Rules**:
1. **Only roll for a credit** (or at worst, even money)
2. **Don't roll into a worse risk/reward**
3. **Rolling is a new trade** — reassess everything

---

## Part 6: Putting It All Together — Trade Example

### Example: Bullish Vertical Spread Implementation

**Scenario**: Stock XYZ at $100, you're moderately bullish expecting move to $110 in next 4 weeks.

#### Phase 1: Analysis
```
Directional: Bullish (Medium conviction)
IV Rank: 35% (Normal)
Time Horizon: 4 weeks
Conclusion: Debit spread makes sense (defined risk, moderate IV)
```

#### Phase 2: Strategy Selection
```
Strategy: Bull Call Spread
Position Delta Target: +0.30 to +0.40
Theta: Will be slightly negative (acceptable)
Vega: Moderate positive (OK with normal IV)
```

#### Phase 3: Execution
```
Buy: $100 Call (ATM, delta ~0.50)
Sell: $105 Call (OTM, delta ~0.30)
Expiration: 6 weeks out (1.5x buffer)
Net Debit: $2.00
Max Profit: $5.00 - $2.00 = $3.00
Max Loss: $2.00
Position Delta: ~+0.20 per spread
Position Size: 5 spreads (risking $1,000 on $50K account = 2%)
```

#### Phase 4: Management
```
Profit Target: Close at 50% profit ($1.00 gain) = $3.00 value
Loss Limit: Close if spread worth $1.00 (50% loss)
Adjustment Trigger: Reassess if stock below $98 or above $107
Time Trigger: Close with 1 week left if not at target
```

---

## Part 7: Application to Prediction Markets

### Implementing the Methodology for Event Contracts

**Phase 1 Analysis for Events**:
```
1. Probability Assessment:
   - What is YOUR estimated probability?
   - What does the CONTRACT price imply?
   - Edge = Your estimate - Market price

2. Volatility/Uncertainty:
   - How much time until event resolution?
   - How much could probability estimates swing?

3. Time Horizon:
   - When does the event resolve?
   - Position size based on time to resolution
```

**Phase 2-3 Strategy Selection & Execution**:
```
IF your_probability > market_price + edge_threshold:
    BUY YES contracts
    Size based on Kelly Criterion or fixed-fraction

IF your_probability < market_price - edge_threshold:
    BUY NO contracts (or sell YES)
    Size accordingly

Edge Threshold: Typically 5-10% for sufficient margin of safety
```

**Phase 4 Management**:
```
Monitor:
- New information that changes probability estimate
- Price movement (take profit if edge disappears)
- Time decay behavior (contracts get more volatile near resolution)

Exit Rules:
- Edge disappeared: Close regardless of P/L
- Large gain (50%+ of position): Take partial profits
- New information invalidates thesis: Exit immediately
```

---

## Summary: The Complete Methodology

```
IMPLEMENTATION CHECKLIST:

□ PHASE 1: ANALYSIS
  □ Directional view determined
  □ IV environment assessed
  □ Time horizon established

□ PHASE 2: STRATEGY SELECTION
  □ Strategy matches outlook
  □ Greek profile aligned with goals
  □ Risk/reward acceptable

□ PHASE 3: EXECUTION
  □ Strikes selected methodically
  □ Expiration gives adequate time
  □ Position sized to risk parameters

□ PHASE 4: MANAGEMENT
  □ Profit target set
  □ Loss limit set
  □ Adjustment triggers defined
  □ Exit conditions clear
```

This methodology transforms options trading from guesswork into systematic process. Each tool (Greek) serves a purpose in each phase, and the strategic view guides which tools matter most for each situation.

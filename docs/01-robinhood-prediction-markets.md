# Robinhood Prediction Markets: Complete Reference Guide

## Overview

**Topic**: Robinhood Prediction Markets (Event Contracts) for Sports Betting
**Purpose**: Foundation document for building a college football prediction/trading application
**Last Updated**: January 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Abstraction Ladder: Three Levels of Understanding](#abstraction-ladder-three-levels-of-understanding)
3. [How Robinhood Event Contracts Work](#how-robinhood-event-contracts-work)
4. [Contract Types and Categories](#contract-types-and-categories)
5. [Pricing, Fees, and Order Types](#pricing-fees-and-order-types)
6. [Trading Strategies](#trading-strategies)
7. [Regulatory Framework](#regulatory-framework)
8. [Edge Cases and Boundary Testing](#edge-cases-and-boundary-testing)
9. [Gaps and Assumptions](#gaps-and-assumptions)
10. [Application to Our Project](#application-to-our-project)

---

## Executive Summary

Robinhood Prediction Markets allow users to trade **event contracts** - financial derivatives that pay $1 if a predicted outcome occurs, or $0 if it doesn't. Launched in March 2025 through a partnership with Kalshi (a CFTC-regulated exchange), this has become Robinhood's fastest-growing product line with **11 billion contracts traded by over 1 million customers**.

**Key Points for Our App:**
- Contracts range from $0.01 to $0.99, with price representing probability (e.g., $0.45 = 45% chance)
- Sports contracts include game outcomes, spreads, totals, and player props
- New features (December 2025): Parlay-style "preset combos" for NFL games
- Fees: $0.01 per contract (Robinhood) + $0.01 exchange fee OR built-in spread
- 24/7 trading availability with limit orders supported

---

## Abstraction Ladder: Three Levels of Understanding

### Level 1 (Fundamental): Core Concepts and Basic Mechanics

**Universal Principle: "Markets aggregate information into prices that reflect collective probability estimates"**

#### What is a Prediction Market?

A prediction market is a marketplace where participants trade contracts based on the outcomes of future events. Unlike traditional betting:
- You trade against other participants (peer-to-peer), not against "the house"
- Prices dynamically reflect real-time probability assessments
- You can exit positions before events conclude (sell early)
- It's regulated as a financial derivative, not gambling

#### The Basic Contract Mechanics

```
Contract Structure:
┌────────────────────────────────────────────────────────────────┐
│  Question: "Will Team A beat Team B?"                         │
│                                                                 │
│  YES Contract: Pays $1 if Team A wins, $0 otherwise            │
│  NO Contract:  Pays $1 if Team B wins (or tie), $0 otherwise   │
│                                                                 │
│  Current Price: YES = $0.65, NO = $0.35                        │
│  Interpretation: Market thinks Team A has 65% chance to win    │
└────────────────────────────────────────────────────────────────┘
```

#### Key Intuitions

| Concept | Intuition | Example |
|---------|-----------|---------|
| **Price = Probability** | Each cent represents ~1% probability | $0.72 = 72% likely |
| **Max Profit** | $1.00 - Purchase Price | Buy at $0.30, max profit = $0.70 |
| **Max Loss** | Your purchase price | Buy at $0.30, max loss = $0.30 |
| **Risk/Reward** | Low price = high risk, high reward | $0.10 contract: 10:1 potential payoff |
| **Zero-Sum** | Total YES + NO prices ≈ $1.00 | If YES = $0.65, NO ≈ $0.35 |

#### The Mental Model

Think of prediction markets as a continuous auction where:
- Buyers believe the event is **more likely** than current price suggests
- Sellers believe the event is **less likely** than current price suggests
- Price moves until buyers and sellers reach equilibrium

```
If YES contract at $0.40 and you think true probability is 60%:
  → Expected Value = (0.60 × $1.00) - $0.40 = $0.20 positive edge
  → Rational to buy YES contracts

If YES contract at $0.75 and you think true probability is 60%:
  → Expected Value = (0.60 × $1.00) - $0.75 = -$0.15 negative edge
  → Rational to sell YES (or buy NO)
```

---

### Level 2 (Intermediate): Contract Pricing, Order Types, and Fee Structure

#### Contract Pricing Mechanics

**Price Range**: $0.01 to $0.99 per contract

```
Price Relationship:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  YES Price + NO Price = $1.00 (theoretical)                │
│  YES Price + NO Price = $1.01 (with spread, actual)        │
│                                                             │
│  The $0.01 difference is the exchange's built-in profit    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Understanding the Spread:**
- Some contracts have explicit $0.01 exchange fee
- Others have "built-in spread" where YES + NO = $1.01
- Both methods result in similar total cost

#### Fee Structure

| Fee Type | Amount | When Applied |
|----------|--------|--------------|
| Robinhood Commission | $0.01/contract | Every trade (buy or sell) |
| Exchange Fee (Kalshi) | $0.01/contract | Some contracts |
| Built-in Spread | ~$0.01 embedded | Alternative to exchange fee |
| Settlement Fee | $0.00 | Free at expiration |

**Total Cost Example:**
```
Buy 100 YES contracts at $0.45:
  Position cost: 100 × $0.45 = $45.00
  Robinhood fee: 100 × $0.01 = $1.00
  Exchange fee:  100 × $0.01 = $1.00
  Total outlay: $47.00

If contract wins ($1.00 payout):
  Gross return: 100 × $1.00 = $100.00
  Net profit: $100.00 - $47.00 = $53.00
  ROI: 53.00/47.00 = 112.8%
```

#### Order Types

**1. Immediate-or-Cancel (IOC)**
- Executes immediately at current market price or cancels
- Used for: Quick entries/exits, dollar-based orders
- No custom price setting

**2. Good-til-Date (GTD)**
- Remains open until next calendar day at 3:00 AM ET
- Allows custom limit prices
- Used for: Patient entries at specific prices

```
Order Type Decision Tree:
                    ┌─────────────────┐
                    │ Need to trade   │
                    │ immediately?    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
         ┌────────┐                   ┌────────┐
         │  YES   │                   │   NO   │
         └────┬───┘                   └────┬───┘
              │                             │
              ▼                             ▼
         Use IOC                     Use GTD with
         at market                   limit price
```

#### Position Management

**Opening a Position:**
- Buy YES = Betting the event happens
- Buy NO = Betting the event doesn't happen

**Closing a Position:**
- Sell your YES contracts (equivalent to buying NO to offset)
- Hold until settlement ($1.00 or $0.00)

**Key Insight**: You can always exit early by selling, locking in gains or cutting losses before final outcome.

---

### Level 3 (Advanced): Trading Strategies and Portfolio Management

#### Strategy 1: Probability Edge Trading

**Concept**: Find contracts where market price differs from your estimated true probability.

```
Edge Calculation:
  True Probability (your estimate): P
  Contract Price: C
  Edge = P - C

  If Edge > 0: Buy YES
  If Edge < 0: Buy NO (or sell YES if holding)

Kelly Criterion for Position Sizing:
  f* = (P × (1-C) - (1-P) × C) / (1-C)

  Where f* = optimal fraction of bankroll to wager
```

**Example**: Market prices Kansas at $0.55 to beat Iowa State. Your analysis says 65% probability.
- Edge = 0.65 - 0.55 = +0.10 (10% edge on YES)
- Kelly: f* = (0.65 × 0.45 - 0.35 × 0.55) / 0.45 = 0.22 (22% of bankroll)

#### Strategy 2: Cross-Platform Arbitrage

**Concept**: Exploit pricing differences between Robinhood/Kalshi and other platforms (Polymarket, ForecastEx).

```
Arbitrage Detection:
┌────────────────────────────────────────────────────────────────┐
│ Platform A (Robinhood): Team X YES = $0.62                     │
│ Platform B (Polymarket): Team X NO = $0.42                     │
│                                                                 │
│ Total cost for guaranteed $1 = $0.62 + $0.42 = $1.04           │
│ Result: NO ARBITRAGE (cost > $1)                               │
│                                                                 │
│ -----------------------------------------------------------    │
│ Platform A (Robinhood): Team X YES = $0.58                     │
│ Platform B (Polymarket): Team X NO = $0.38                     │
│                                                                 │
│ Total cost for guaranteed $1 = $0.58 + $0.38 = $0.96           │
│ Result: ARBITRAGE EXISTS ($0.04 risk-free profit per $0.96)    │
│ Net after fees: ~$0.01-0.02 profit                             │
└────────────────────────────────────────────────────────────────┘
```

**Practical Challenges:**
- Fee drag: $0.01-0.02 per contract per platform eats into margins
- Execution risk: Prices move before both legs execute
- Capital lockup: Funds tied until settlement
- Platform differences: Settlement rules may vary

#### Strategy 3: Hedging and Correlated Positions

**Concept**: Use correlated markets to reduce variance while maintaining edge.

```
Correlation Hedging Example:
┌────────────────────────────────────────────────────────────────┐
│ Position: Long Georgia YES at $0.75 to win SEC Championship   │
│                                                                 │
│ Correlated Hedge: Short Georgia YES at $0.85 to win CFP       │
│                                                                 │
│ Logic: If Georgia loses SEC, both lose (but hedge profits)     │
│        If Georgia wins SEC but loses CFP, net even             │
│        If Georgia wins both, net positive on SEC leg           │
│                                                                 │
│ This isolates the "Georgia wins SEC only" outcome              │
└────────────────────────────────────────────────────────────────┘
```

#### Strategy 4: Live Trading / News Momentum

**Concept**: Trade on information flow during live events.

```
Live Event Trading Flow:

  Pre-Game     Kickoff      In-Game       Final
     │            │            │            │
     ▼            ▼            ▼            ▼
  [$0.55]  →  [$0.58]  →  [$0.72]  →  [$1.00]
                              ▲
                              │
                        Score update:
                        Your team scores
                        → Price jumps
                        → Sell here for profit
                        (Don't wait for $1.00)
```

**Key Insight**: You don't need to be right about the final outcome. You need to be right about how the market will move in the short term.

#### Strategy 5: Preset Combos (Parlays)

**New Feature (December 2025)**: Robinhood offers preset combinations within individual NFL games.

```
Combo Structure:
┌────────────────────────────────────────────────────────────────┐
│ PRESET COMBO: Chiefs vs Ravens                                 │
│                                                                 │
│ Leg 1: Chiefs Win (Moneyline)                                  │
│ Leg 2: Over 47.5 Total Points                                  │
│ Leg 3: Chiefs Cover -3.5 Spread                                │
│                                                                 │
│ Combo Price: $0.12                                             │
│ Payout if ALL correct: $1.00                                   │
│ Implied probability: 12%                                       │
│                                                                 │
│ Your job: Decide if true probability > 12%                     │
└────────────────────────────────────────────────────────────────┘
```

**Coming in 2026**: Custom combos of up to 10 outcomes across NFL games.

#### Portfolio Management Principles

1. **Position Sizing**: Never risk more than 5-10% of bankroll on single contract
2. **Diversification**: Spread across uncorrelated events
3. **Bankroll Management**: Track all positions, know total exposure
4. **Record Keeping**: Log every trade with rationale for later analysis

```
Portfolio Dashboard Concept:
┌─────────────────────────────────────────────────────────────────┐
│ BANKROLL: $1,000                                                │
│ DEPLOYED: $450 (45%)                                            │
│ AVAILABLE: $550 (55%)                                           │
│                                                                  │
│ POSITIONS:                                                       │
│ ┌─────────────┬────────┬─────────┬───────────┬────────────────┐ │
│ │ Contract    │ Side   │ Qty     │ Avg Price │ Current Value  │ │
│ ├─────────────┼────────┼─────────┼───────────┼────────────────┤ │
│ │ Georgia ML  │ YES    │ 100     │ $0.72     │ $0.75 (+$3)    │ │
│ │ Ohio St ML  │ NO     │ 50      │ $0.28     │ $0.30 (+$1)    │ │
│ │ LSU +7.5    │ YES    │ 200     │ $0.55     │ $0.52 (-$6)    │ │
│ └─────────────┴────────┴─────────┴───────────┴────────────────┘ │
│                                                                  │
│ EXPECTED VALUE: +$42 │ CONFIDENCE: Medium │ CORRELATION: Low    │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Robinhood Event Contracts Work

### Account Requirements

1. **Robinhood Individual Investing Account** (required base)
2. **Robinhood Derivatives Account** (additional application)
3. **Age**: 18+ (unlike 21+ for traditional sportsbooks)
4. **Location**: All US states except:
   - Maryland: No access to event contracts
   - Nevada: No sports event contracts (as of Dec 1, 2025)

### The Kalshi Connection

Robinhood partners with **Kalshi** (KalshiEX LLC), a CFTC-regulated exchange, to facilitate event contract trading.

```
Trade Flow:
┌──────────┐      ┌───────────────┐      ┌────────────┐
│ You      │ ──▶  │ Robinhood App │ ──▶  │ Kalshi     │
│ (Trader) │      │ (Interface)   │      │ (Exchange) │
└──────────┘      └───────────────┘      └────────────┘
                         │
                         ▼
                  Order Matching
                  Settlement
                  Regulatory Compliance
```

**Future Change (2026)**: Robinhood acquiring LedgerX exchange will reduce Kalshi dependency.

### Settlement Process

1. Event occurs and outcome is determined
2. Contracts settle at $1.00 (correct) or $0.00 (incorrect)
3. Proceeds available within **2 business days**
4. Buying power updates only after settlement

---

## Contract Types and Categories

### Sports Contracts

| Type | Description | Example |
|------|-------------|---------|
| **Moneyline** | Which team wins | "Chiefs win vs Ravens" |
| **Spread** | Win by certain margin | "Chiefs -3.5" |
| **Total (O/U)** | Combined score threshold | "Over 47.5 points" |
| **Player Props** | Individual performance | "Mahomes 300+ pass yards" |
| **Preset Combos** | Multiple legs, one game | "Chiefs ML + Over + Cover" |

### Other Categories (Non-Sports)

- **Politics**: Election outcomes, policy decisions
- **Economics**: Fed rate decisions, inflation data
- **Crypto**: Bitcoin price targets
- **Culture**: Award shows, entertainment events
- **Weather**: Temperature, precipitation

---

## Pricing, Fees, and Order Types

### Complete Fee Table

| Action | Robinhood Fee | Kalshi Fee | Total |
|--------|---------------|------------|-------|
| Buy contract | $0.01 | $0.01* | $0.02 |
| Sell contract | $0.01 | $0.01* | $0.02 |
| Hold to settlement | $0.00 | $0.00 | $0.00 |

*Or built-in spread where YES + NO = $1.01

### Profit/Loss Calculations

```python
# Python calculation for reference
def calculate_trade(buy_price, quantity, outcome_won):
    """Calculate P&L for a prediction market trade"""

    position_cost = buy_price * quantity
    robinhood_fee = 0.01 * quantity
    exchange_fee = 0.01 * quantity
    total_cost = position_cost + robinhood_fee + exchange_fee

    if outcome_won:
        payout = 1.00 * quantity
        profit = payout - total_cost
    else:
        payout = 0.00
        profit = -total_cost

    return {
        'total_cost': total_cost,
        'payout': payout,
        'profit': profit,
        'roi_percent': (profit / total_cost) * 100 if outcome_won else -100
    }

# Example: Buy 100 contracts at $0.45, team wins
result = calculate_trade(0.45, 100, True)
# Returns: {'total_cost': 47.00, 'payout': 100.00, 'profit': 53.00, 'roi_percent': 112.8}
```

---

## Trading Strategies

### Summary of Key Strategies

| Strategy | Skill Level | Capital Needs | Time Commitment | Edge Source |
|----------|-------------|---------------|-----------------|-------------|
| Probability Edge | Beginner | Low | Medium | Analysis superiority |
| News Momentum | Intermediate | Medium | High | Speed, information |
| Cross-Platform Arb | Advanced | High | Low | Capital, execution |
| Correlation Hedging | Advanced | High | Medium | Quant modeling |
| Combo/Parlay | Intermediate | Low | Medium | Multi-factor analysis |

### Strategy Selection Framework

```
Decision Tree for Strategy Selection:

        ┌─────────────────────────────┐
        │ Do you have an information  │
        │ edge (better probability    │
        │ estimates than market)?     │
        └─────────────┬───────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
         [YES]                  [NO]
           │                     │
           ▼                     ▼
    Probability Edge      ┌─────────────────┐
    Trading               │ Do you have     │
                          │ capital across  │
                          │ multiple        │
                          │ platforms?      │
                          └────────┬────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                        ▼                     ▼
                      [YES]                  [NO]
                        │                     │
                        ▼                     ▼
                 Cross-Platform        News Momentum
                 Arbitrage             (Follow live events)
```

---

## Regulatory Framework

### Legal Status

| Aspect | Status |
|--------|--------|
| **Federal Regulation** | CFTC-regulated via Kalshi |
| **Classification** | Financial derivative, NOT gambling |
| **State Laws** | Generally bypasses state gambling laws |
| **Age Requirement** | 18+ (not 21+) |

### Ongoing Legal Challenges

- **NFL & NCAA**: Arguing it's "unregulated gambling"
- **State AGs**: Cease-and-desist letters (MD, MA, MT, NV, NJ, OH)
- **Tribal Gaming**: IGRA violation claims (California tribes)
- **Connecticut**: Claims improper licensing

### Tax Implications

- Treated as **capital gains** for tax purposes
- Short-term vs long-term rates apply
- Platform may or may not issue 1099 forms (guidance evolving)
- Recommendation: Consult tax professional, keep detailed records

---

## Edge Cases and Boundary Testing

### Edge Case 1: Game Postponement/Cancellation

**Scenario**: A football game is postponed due to weather.

**Abstract Principle**: Contracts should have clear, predictable resolution rules.

**Actual Resolution**:
- Kalshi has specific rules for each contract type
- Generally: Game must occur within specified timeframe or contract void
- Voided contracts return original investment (minus fees paid)

**Alignment**: ⚠️ Requires reading specific contract rules

### Edge Case 2: Price at Exactly $0.50

**Scenario**: Contract trades at $0.50 - is this "fair" or opportunity?

**Abstract Principle**: Price = probability, so $0.50 = 50/50.

**Reality**:
- After fees, $0.50 is actually slightly negative EV for both sides
- True break-even is around $0.52 YES / $0.48 NO (accounting for $0.02 roundtrip fees)
- Observation: $0.50 contracts often have lower volume (no edge for anyone)

**Alignment**: ✓ With fee adjustment, matches principle

### Edge Case 3: Late Information / Insider Knowledge

**Scenario**: You learn a key player is injured before market knows.

**Abstract Principle**: Markets aggregate public information.

**Reality**:
- Trading on material non-public information is... complicated
- CFTC regulations differ from SEC
- Kalshi terms of service prohibit certain insider trading
- Ethical/legal gray area

**Alignment**: ⚠️ Requires further legal clarity

### Edge Case 4: Illiquid Markets

**Scenario**: You want to buy 1,000 contracts but only 200 available at current price.

**Abstract Principle**: Price reflects probability.

**Reality**:
- Your large order will move the market (slippage)
- True cost may be $0.45 for first 200, $0.47 for next 200, etc.
- Average price worse than quoted price

**Alignment**: ✗ Displayed price only valid for small orders

---

## Gaps and Assumptions

### Assumptions in This Document

1. **Kalshi partnership continues** - Robinhood's LedgerX acquisition may change fee structure
2. **Regulatory status stable** - Ongoing lawsuits could restrict access
3. **Platform availability** - State-by-state rules may change
4. **Fee structure current** - Fees may change with competition

### Gaps Not Covered

1. **API Access**: Does Robinhood/Kalshi offer programmatic trading?
2. **Real-time Data Feeds**: WebSocket vs polling for live odds?
3. **Historical Data**: Where to get historical contract prices for backtesting?
4. **Margin/Leverage**: Are leveraged positions available?
5. **Tax Reporting**: Automated 1099 integration?

### What Would Change If...

- **Competition increases**: Lower fees, better spreads
- **Regulation tightens**: Possible state-level restrictions
- **Market matures**: Higher liquidity, tighter spreads, less edge
- **New contract types**: More granular prop bets, custom combos

---

## Application to Our Project

### How This Informs Our App Design

1. **Core Feature**: Display contract prices as probabilities (visual transformation)
2. **Edge Calculator**: Compare market prices to user's probability estimates
3. **Fee Integration**: Always show net P&L after fees
4. **Live Updates**: Critical for news momentum strategy
5. **Position Tracker**: Portfolio dashboard with total exposure
6. **Alert System**: Notify when prices cross user-defined thresholds

### Key Technical Requirements

- Real-time price feeds (polling or WebSocket to be determined)
- Probability visualization (gauges, charts)
- P&L calculator with fee adjustment
- Portfolio tracking and correlation analysis
- Historical data for pattern recognition

### Next Steps (Step 2)

- Research odds data sources and APIs
- Understand polling vs WebSocket strategies
- Map external odds to Robinhood contract structure

---

## Sources

- [Robinhood Prediction Markets Hub](https://robinhood.com/us/en/prediction-markets/)
- [Robinhood Event Contracts Support](https://robinhood.com/us/en/support/articles/robinhood-event-contracts/)
- [Robinhood Newsroom: Prediction Markets Launch](https://robinhood.com/us/en/newsroom/robinhood-prediction-markets-hub/)
- [Yahoo Finance: How Prediction Markets Work](https://finance.yahoo.com/personal-finance/investing/article/prediction-markets-what-they-are-and-how-they-work-130052363.html)
- [CNBC: Robinhood NFL Parlay Bets](https://www.cnbc.com/2025/12/16/robinhood-is-rolling-out-nfl-parlay-and-prop-bets-on-prediction-markets-platform.html)
- [Bleacher Nation: Robinhood Sports Prediction Markets](https://www.bleachernation.com/robinhood-betting-prediction-markets/)
- [Kalshi Help Center](https://help.kalshi.com/kalshi-101/what-are-prediction-markets)
- [SportsGrid: Kalshi Trading Strategies](https://www.sportsgrid.com/prediction-market/beginner-trading-strategies)
- [QuantPedia: Systematic Edges in Prediction Markets](https://quantpedia.com/systematic-edges-in-prediction-markets/)
- [Sportico: Sports Prediction Markets Controversy](https://www.sportico.com/business/sports-betting/2025/prediction-markets-sports-kalshi-robinhood-polymarket-1234858418/)

# College Football Prediction App: Design Document

## Superforecaster-Driven Event Contract Trading Platform

---

## 1. Executive Summary

This document outlines the architecture, features, and implementation plan for a college football prediction/betting application that combines:

1. **Live data integration** (odds from The Odds API, scores from ESPN hidden API)
2. **Superforecaster methodology** (Bayesian updating, base rates, reference class forecasting)
3. **Options-inspired strategies** adapted for binary prediction markets (Robinhood/Kalshi event contracts)
4. **Visual, intuitive UI** for real-time decision support

The app transforms the user from a casual bettor into a disciplined prediction market strategist by providing analytical tools that surface edge, manage risk, and track performance systematically.

---

## 2. Architecture Overview

### 2.1 System Architecture

```
+-------------------------------------------------------------------+
|                        CLIENT (React/Next.js)                      |
|  +-------------------+  +------------------+  +------------------+ |
|  |  Dashboard View   |  |  Game Detail     |  |  Portfolio View  | |
|  |  - Live scores    |  |  - Edge calc     |  |  - Positions     | |
|  |  - Odds tracker   |  |  - Strategy sim  |  |  - P&L tracking  | |
|  |  - Alerts         |  |  - Bayesian tool |  |  - Performance   | |
|  +-------------------+  +------------------+  +------------------+ |
|                              |                                     |
|                     WebSocket Connection                           |
+-------------------------------------------------------------------+
                               |
+-------------------------------------------------------------------+
|                    BACKEND (Node.js/Python FastAPI)                |
|  +------------------+  +------------------+  +------------------+  |
|  | Data Aggregator  |  | Analytics Engine |  | User Service     |  |
|  | - Poll ESPN      |  | - Edge calcs     |  | - Auth           |  |
|  | - Poll Odds API  |  | - Bayesian model |  | - Preferences    |  |
|  | - Normalize data |  | - Kelly sizing   |  | - Position log   |  |
|  +------------------+  +------------------+  +------------------+  |
|                              |                                     |
|                         Redis Cache                                |
+-------------------------------------------------------------------+
                               |
+-------------------------------------------------------------------+
|                      EXTERNAL DATA SOURCES                         |
|  +------------------+  +------------------+  +------------------+  |
|  | ESPN Hidden API  |  | The Odds API    |  | Historical DB     |  |
|  | - Live scores    |  | - Betting lines |  | - Past games      |  |
|  | - Game status    |  | - Multi-book    |  | - Base rates      |  |
|  | - Play-by-play   |  | - Line history  |  | - Team stats      |  |
|  +------------------+  +------------------+  +------------------+  |
+-------------------------------------------------------------------+
```

### 2.2 Data Flow

```
1. INGESTION (Every 5-60 seconds depending on game state)
   ESPN API --> Backend --> Normalize --> Cache --> WebSocket --> Client
   Odds API --> Backend --> Normalize --> Cache --> WebSocket --> Client

2. ANALYSIS (On-demand + triggered by data updates)
   User Input (probability estimate) + Market Data --> Edge Calculator
   Historical Data + Current Game State --> Bayesian Updater
   Edge + Bankroll --> Position Sizer (Kelly Criterion)

3. PERSISTENCE
   Positions --> PostgreSQL
   Performance Metrics --> PostgreSQL
   Cache (live data) --> Redis
```

### 2.3 Technology Stack Recommendations

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 + React | SSR for fast initial load, excellent DX |
| **UI Components** | Tailwind CSS + shadcn/ui | Modern, customizable, consistent |
| **Charts** | D3.js or Recharts | Complex visualizations for probability/odds |
| **State Management** | Zustand or React Query | Lightweight, good for real-time data |
| **Backend** | Python FastAPI | Fast, async-native, great for data processing |
| **Real-time** | WebSocket (Socket.io or native) | Push updates to client |
| **Cache** | Redis | Sub-millisecond reads for live data |
| **Database** | PostgreSQL | Relational data (positions, users, history) |
| **Auth** | Clerk or NextAuth | Simple, secure authentication |

---

## 3. Data Sources and Integration

### 3.1 ESPN Hidden API (Live Scores)

**Endpoints:**
```javascript
const ESPN_ENDPOINTS = {
  scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  summary: (gameId) => `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`,
  rankings: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings'
};

// Query parameters
// ?dates=20260101 - specific date
// ?groups=80 - all FBS games
// ?groups=8 - SEC conference
```

**Polling Strategy:**
- Pre-game: 60 seconds
- Live game: 5-10 seconds
- Post-game: Stop polling

**Data Extracted:**
- Game ID, teams, scores
- Quarter/period, game clock
- Game status (scheduled, in-progress, final)
- Possession, yard line, down/distance (from summary endpoint)

### 3.2 The Odds API (Betting Lines)

**Endpoints:**
```javascript
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const ODDS_ENDPOINTS = {
  sports: `${ODDS_API_BASE}/sports`,
  ncaafOdds: (markets = 'h2h,spreads,totals') =>
    `${ODDS_API_BASE}/sports/americanfootball_ncaaf/odds?regions=us&markets=${markets}&oddsFormat=american&apiKey=${API_KEY}`,
  eventOdds: (eventId) =>
    `${ODDS_API_BASE}/sports/americanfootball_ncaaf/events/${eventId}/odds?regions=us&apiKey=${API_KEY}`
};
```

**Credit Usage Strategy (Free Tier: 500/month):**
- Poll every 60 seconds during live games
- Poll every 5 minutes pre-game (within 24 hours)
- Aggregate multiple books (DraftKings, FanDuel, BetMGM)
- Cache aggressively to minimize redundant calls

**Data Extracted:**
- Moneyline odds (h2h)
- Point spread and price
- Total (over/under) and price
- Timestamp of last update
- Multiple bookmaker prices for consensus

### 3.3 Data Normalization Layer

```python
@dataclass
class NormalizedGame:
    game_id: str
    home_team: str
    away_team: str
    start_time: datetime
    status: str  # "scheduled", "in_progress", "final"

    # Scores
    home_score: int
    away_score: int
    period: int
    clock: str

    # Odds (consensus across books)
    home_moneyline: int
    away_moneyline: int
    home_ml_probability: float  # Implied, vig-removed
    away_ml_probability: float

    spread_line: float  # e.g., -3.5 for home team
    spread_price: int

    total_line: float  # e.g., 52.5
    over_price: int
    under_price: int

    # Derived
    home_robinhood_expected: float  # Expected YES contract price
    away_robinhood_expected: float
```

---

## 4. Core Features

### 4.1 Feature Map

```
+-----------------------------------------------------------------------+
|                           CORE FEATURES                                |
+-----------------------------------------------------------------------+
|                                                                        |
|  +---------------------------+    +---------------------------+        |
|  |   1. LIVE DASHBOARD       |    |   2. EDGE CALCULATOR      |        |
|  |   - Scoreboard grid       |    |   - Your probability      |        |
|  |   - Odds comparison       |    |   - Market probability    |        |
|  |   - Quick edge indicators |    |   - Edge % display        |        |
|  |   - Alert badges          |    |   - Visual gauge          |        |
|  +---------------------------+    +---------------------------+        |
|                                                                        |
|  +---------------------------+    +---------------------------+        |
|  |   3. BAYESIAN WORKBENCH   |    |   4. STRATEGY SIMULATOR   |        |
|  |   - Prior probability     |    |   - Position builder      |        |
|  |   - Evidence inputs       |    |   - Risk/reward preview   |        |
|  |   - Posterior calc        |    |   - Multi-leg combos      |        |
|  |   - Update history        |    |   - P&L scenarios         |        |
|  +---------------------------+    +---------------------------+        |
|                                                                        |
|  +---------------------------+    +---------------------------+        |
|  |   5. PORTFOLIO TRACKER    |    |   6. PERFORMANCE ANALYTICS|        |
|  |   - Open positions        |    |   - Brier score tracking  |        |
|  |   - P&L by position       |    |   - Calibration chart     |        |
|  |   - Total exposure        |    |   - ROI over time         |        |
|  |   - Greeks equivalent     |    |   - Edge realized vs exp  |        |
|  +---------------------------+    +---------------------------+        |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 4.2 Feature Details

#### Feature 1: Live Dashboard

**Purpose:** Real-time command center showing all active and upcoming games with integrated odds and edge indicators.

**UI Components:**
- Game cards in grid layout (responsive)
- Each card shows: teams, scores, odds, quick edge badge
- Filtering by: conference, date, edge threshold
- Sorting by: kickoff time, edge magnitude, spread

**Visual Elements:**
```
+----------------------------------------------------------+
| #3 Georgia @ #1 Alabama          LIVE Q3 8:42            |
+----------------------------------------------------------+
| Georgia           |  Alabama                              |
| 21                |  17                                   |
+----------------------------------------------------------+
| ML: -150 (60%)    |  ML: +130 (43%)                      |
| Spread: -3.5      |  Spread: +3.5                         |
| Total: O/U 52.5                                           |
+----------------------------------------------------------+
| [EDGE: +8%] Your est: 68% | Market: 60%     [ANALYZE]    |
+----------------------------------------------------------+
```

#### Feature 2: Edge Calculator

**Purpose:** Core analytical tool that compares user's probability estimate to market-implied probability.

**Inputs:**
- User's probability estimate (slider or direct input)
- Market price (auto-populated from odds feed)
- Contract price on Robinhood (manual input or future API)

**Calculations:**
```python
def calculate_edge(user_probability: float, market_price: float) -> dict:
    """
    user_probability: 0-1 scale (e.g., 0.65 = 65%)
    market_price: Robinhood contract price $0.01-$0.99
    """
    edge = user_probability - market_price
    edge_percent = edge * 100

    # Expected Value per contract
    ev_per_contract = (user_probability * (1.00 - market_price)) - ((1 - user_probability) * market_price)

    # Kelly Criterion for position sizing
    if edge > 0:
        kelly_fraction = (user_probability * (1 - market_price) - (1 - user_probability) * market_price) / (1 - market_price)
    else:
        kelly_fraction = 0

    return {
        "edge": edge,
        "edge_percent": edge_percent,
        "ev_per_contract": ev_per_contract,
        "kelly_fraction": kelly_fraction,
        "recommendation": "BUY YES" if edge > 0.03 else "BUY NO" if edge < -0.03 else "NO EDGE"
    }
```

**Visual Elements:**
- Probability gauge (semicircle: red-yellow-green)
- Edge meter showing positive/negative edge
- Risk/reward bar chart
- Confidence interval visualization

#### Feature 3: Bayesian Workbench

**Purpose:** Structured tool for updating probability estimates as new information arrives.

**Superforecaster Methodology Integration:**

1. **Base Rate Anchoring:**
   ```python
   def get_base_rate(context: dict) -> float:
       """
       Reference class forecasting: What's the historical base rate?
       Examples:
       - Home team win rate in CFB: ~57%
       - Top 10 vs unranked: ~85%
       - Underdog cover rate: ~52%
       - SEC home favorites: ~62%
       """
       # Query historical database for similar matchups
       return historical_win_rate(context)
   ```

2. **Bayesian Updating Formula:**
   ```python
   def bayesian_update(prior: float, likelihood_ratio: float) -> float:
       """
       Bayes' theorem: P(A|B) = P(B|A) * P(A) / P(B)

       Simplified: posterior_odds = prior_odds * likelihood_ratio

       prior: Your base rate probability (e.g., 0.60)
       likelihood_ratio: How much more likely is this evidence if hypothesis is true vs false?
       """
       prior_odds = prior / (1 - prior)
       posterior_odds = prior_odds * likelihood_ratio
       posterior = posterior_odds / (1 + posterior_odds)
       return posterior
   ```

3. **Evidence Catalog:**
   ```
   +------------------------------------------------------------------+
   | EVIDENCE TYPE          | TYPICAL LIKELIHOOD RATIO | DIRECTION    |
   +------------------------------------------------------------------+
   | Key player injury      | 0.7 - 0.85              | Decrease     |
   | Weather (rain/wind)    | 0.9 - 1.1               | Context-dep  |
   | Coaching change        | 0.8 - 1.2               | Variable     |
   | Revenge game           | 1.05 - 1.15             | Increase     |
   | Rest advantage         | 1.1 - 1.2               | Increase     |
   | Travel distance        | 0.95 - 1.0              | Slight dec   |
   | Early game data (Q1)   | Variable                | Significant  |
   +------------------------------------------------------------------+
   ```

**UI Components:**
- Prior probability slider with base rate reference
- Evidence input panel (dropdown + custom likelihood ratio)
- Update chain visualization (showing probability evolution)
- Final posterior with confidence interval

#### Feature 4: Strategy Simulator (Options-Inspired)

**Purpose:** Apply options trading concepts to prediction market positioning.

**Options-to-Prediction Market Mapping:**

| Options Concept | Prediction Market Equivalent | Implementation |
|-----------------|------------------------------|----------------|
| **Long Call** | Buy YES contract | Bullish on outcome |
| **Long Put** | Buy NO contract | Bearish on outcome |
| **Delta** | ~1.0 (binary contracts move 1:1 with probability) | Position sensitivity |
| **Theta (Time Decay)** | Uncertainty premium decay as event approaches | Track extrinsic value erosion |
| **Vega (Volatility)** | Uncertainty premium in early markets | Higher prices when outcome uncertain |
| **IV Crush Analog** | Post-kickoff probability convergence | Rapid price movement at game start |
| **Spread Strategy** | Correlated positions across markets | Hedge spread bet with moneyline |
| **Iron Condor** | Multiple legs on related outcomes | Position for range-bound total score |

**Strategy Templates:**

```python
class PredictionStrategy:
    """Base class for prediction market strategies"""

    def __init__(self, bankroll: float):
        self.bankroll = bankroll
        self.positions = []

    def add_leg(self, contract: str, side: str, probability: float, price: float, quantity: int):
        self.positions.append({
            "contract": contract,
            "side": side,  # "YES" or "NO"
            "probability": probability,
            "price": price,
            "quantity": quantity,
            "max_loss": price * quantity if side == "YES" else (1 - price) * quantity,
            "max_gain": (1 - price) * quantity if side == "YES" else price * quantity
        })

    def calculate_portfolio_metrics(self) -> dict:
        total_exposure = sum(p["max_loss"] for p in self.positions)
        total_potential = sum(p["max_gain"] for p in self.positions)
        weighted_edge = sum(p["probability"] - p["price"] for p in self.positions if p["side"] == "YES")

        return {
            "total_exposure": total_exposure,
            "total_potential": total_potential,
            "risk_reward_ratio": total_potential / total_exposure if total_exposure > 0 else 0,
            "bankroll_at_risk_pct": (total_exposure / self.bankroll) * 100,
            "weighted_edge": weighted_edge
        }
```

**Strategy Types:**

1. **Single Leg (Directional)**
   - Simple YES or NO position
   - Edge threshold: >5% recommended
   - Position sizing via Kelly Criterion

2. **Correlation Hedge**
   - Example: Long Georgia SEC Championship YES, Short Georgia CFP YES
   - Isolates specific outcome (Georgia wins SEC but loses CFP)

3. **Multi-Game Parlay Analysis**
   - Shows independent probability vs. correlated probability
   - Calculates fair parlay price vs. market price
   - Identifies when parlay offers edge over individual legs

4. **Live Trading / Momentum**
   - Track price movement during games
   - Alert when price moves faster than game state justifies
   - "IV Crush" analog: sell overpriced contracts at kickoff

**Visual Elements:**
- Position builder with drag-and-drop legs
- Payoff diagram (like options P&L chart)
- Scenario matrix showing outcomes
- Real-time P&L tracking

#### Feature 5: Portfolio Tracker

**Purpose:** Track all positions, calculate real-time P&L, manage exposure.

**Data Model:**
```python
@dataclass
class Position:
    id: str
    game_id: str
    contract_type: str  # "moneyline", "spread", "total"
    team_or_outcome: str
    side: str  # "YES" or "NO"
    entry_price: float
    quantity: int
    entry_time: datetime
    current_price: float
    status: str  # "open", "closed", "expired"
    exit_price: Optional[float]
    exit_time: Optional[datetime]

    @property
    def unrealized_pnl(self) -> float:
        if self.side == "YES":
            return (self.current_price - self.entry_price) * self.quantity
        else:
            return (self.entry_price - self.current_price) * self.quantity

    @property
    def realized_pnl(self) -> float:
        if self.status != "closed":
            return 0
        if self.side == "YES":
            return (self.exit_price - self.entry_price) * self.quantity
        else:
            return (self.entry_price - self.exit_price) * self.quantity
```

**Dashboard View:**
```
+------------------------------------------------------------------+
| PORTFOLIO OVERVIEW                                                |
+------------------------------------------------------------------+
| Bankroll: $1,000 | Deployed: $450 (45%) | Available: $550 (55%)  |
+------------------------------------------------------------------+
| Total P&L: +$47.50 (+4.75%)  | Win Rate: 62% (13/21)            |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| OPEN POSITIONS                                                    |
+------------------------------------------------------------------+
| Game          | Contract      | Side | Qty | Entry | Current | P&L|
+------------------------------------------------------------------+
| UGA @ ALA     | UGA ML        | YES  | 100 | $0.62 | $0.68   |+$6 |
| OSU vs MICH   | MICH +7.5     | YES  | 50  | $0.48 | $0.45   |-$1.50|
| LSU @ TAMU    | Over 52.5     | YES  | 75  | $0.55 | $0.58   |+$2.25|
+------------------------------------------------------------------+
| Total Exposure: $165 | Unrealized P&L: +$6.75                    |
+------------------------------------------------------------------+
```

#### Feature 6: Performance Analytics

**Purpose:** Track forecasting accuracy over time using superforecaster metrics.

**Key Metrics:**

1. **Brier Score:**
   ```python
   def brier_score(predictions: List[Tuple[float, int]]) -> float:
       """
       predictions: List of (probability_estimate, actual_outcome)
       actual_outcome: 1 if event happened, 0 if not

       Lower is better. 0 = perfect, 0.25 = random guessing
       """
       return sum((p - o) ** 2 for p, o in predictions) / len(predictions)
   ```

2. **Calibration:**
   - Group predictions by confidence bucket (50-60%, 60-70%, etc.)
   - Compare predicted frequency to actual frequency
   - Perfect calibration: 70% predictions should win 70% of time

3. **Resolution:**
   - Measures how much predictions deviate from base rate
   - Higher resolution = more informative predictions

4. **Edge Realized vs. Expected:**
   ```python
   def edge_analysis(positions: List[Position]) -> dict:
       expected_edge = sum(p.expected_edge * p.quantity for p in positions)
       realized_edge = sum(p.realized_pnl for p in positions)

       return {
           "expected_edge": expected_edge,
           "realized_edge": realized_edge,
           "luck_factor": realized_edge - expected_edge,
           "edge_capture_rate": realized_edge / expected_edge if expected_edge > 0 else 0
       }
   ```

**Visual Elements:**
- Calibration chart (predicted vs actual frequency)
- Brier score over time (line chart)
- ROI curve (cumulative returns)
- Edge distribution histogram

---

## 5. Superforecaster Methodology Integration

### 5.1 Core Principles Applied

| Superforecaster Principle | App Implementation |
|---------------------------|---------------------|
| **Base rates first** | Historical database + reference class selector |
| **Update incrementally** | Bayesian workbench with evidence chain |
| **Granular probabilities** | Slider allows 1% increments, not just "likely/unlikely" |
| **Track and learn** | Brier score, calibration charts, prediction journal |
| **Avoid overconfidence** | Confidence interval display, Kelly fraction caps |
| **Consider multiple perspectives** | Multi-book odds display, consensus indicator |

### 5.2 Reference Class Database

**Structure:**
```python
class ReferenceClass:
    """Historical base rates for different game contexts"""

    CATEGORIES = {
        "home_field": {
            "all_cfb_home": 0.57,
            "sec_home": 0.59,
            "big_ten_home": 0.56,
            "top_10_at_home": 0.78,
            "night_game_home": 0.61
        },
        "ranking_matchups": {
            "top_5_vs_unranked": 0.89,
            "top_10_vs_top_25": 0.68,
            "top_25_vs_unranked": 0.82,
            "unranked_vs_unranked": 0.57  # home team
        },
        "spread_performance": {
            "favorite_cover_rate": 0.48,
            "underdog_cover_rate": 0.52,
            "home_underdog_cover": 0.54,
            "double_digit_favorite": 0.47
        },
        "totals": {
            "over_hit_rate": 0.49,
            "over_in_rain": 0.42,
            "over_indoor": 0.53
        }
    }
```

### 5.3 Bayesian Update Engine

**Implementation:**
```python
class BayesianForecaster:
    def __init__(self, prior: float):
        self.prior = prior
        self.posterior = prior
        self.update_history = []

    def update(self, evidence: str, likelihood_ratio: float, notes: str = ""):
        """
        Apply single piece of evidence to update probability
        """
        prior_odds = self.posterior / (1 - self.posterior)
        posterior_odds = prior_odds * likelihood_ratio
        new_posterior = posterior_odds / (1 + posterior_odds)

        self.update_history.append({
            "timestamp": datetime.now(),
            "evidence": evidence,
            "likelihood_ratio": likelihood_ratio,
            "prior": self.posterior,
            "posterior": new_posterior,
            "notes": notes
        })

        self.posterior = new_posterior
        return self.posterior

    def get_confidence_interval(self, confidence: float = 0.90) -> Tuple[float, float]:
        """
        Estimate uncertainty around posterior
        Based on number of updates and evidence quality
        """
        # Simplified: wider interval with fewer updates
        n_updates = len(self.update_history)
        base_width = 0.15  # +/- 15% with no updates
        adjusted_width = base_width / (1 + n_updates * 0.2)

        lower = max(0, self.posterior - adjusted_width)
        upper = min(1, self.posterior + adjusted_width)

        return (lower, upper)
```

---

## 6. Options-to-Prediction Market Mapping (Detailed)

### 6.1 Greek Equivalents

```
+------------------------------------------------------------------+
| OPTIONS GREEK | PREDICTION MARKET EQUIVALENT                      |
+------------------------------------------------------------------+
| DELTA (Δ)     | Effectively ~1.0 for all contracts                |
|               | Binary outcome: price moves 1:1 with probability  |
|               | A $0.50 contract at $0.60 is +$0.10 P&L           |
+------------------------------------------------------------------+
| GAMMA (Γ)     | Not directly applicable (no strike price)         |
|               | However: rate of delta change in LIVE games       |
|               | Early in game: probabilities shift faster         |
+------------------------------------------------------------------+
| THETA (Θ)     | Time/Uncertainty Decay                             |
|               | Pre-game: contracts have "uncertainty premium"    |
|               | As event approaches, premium compresses            |
|               | Post-kickoff: rapid convergence to true odds      |
+------------------------------------------------------------------+
| VEGA (ν)      | Uncertainty Sensitivity                            |
|               | High uncertainty = wider bid-ask, volatile prices |
|               | Low uncertainty (late game) = tighter prices      |
|               | "IV Crush" analog: prices stabilize at kickoff    |
+------------------------------------------------------------------+
| RHO (ρ)       | Not applicable (no interest rate component)       |
+------------------------------------------------------------------+
```

### 6.2 Strategy Adaptations

**1. Edge Trading (Probability Edge = Covered Call equivalent)**
```python
def edge_trade_strategy(user_prob: float, market_price: float, bankroll: float) -> dict:
    """
    Simple directional bet when edge exists
    Analogous to: buying undervalued options
    """
    edge = user_prob - market_price

    if abs(edge) < 0.03:
        return {"action": "NO TRADE", "reason": "Insufficient edge (<3%)"}

    # Kelly Criterion for sizing
    kelly = (user_prob * (1 - market_price) - (1 - user_prob) * market_price) / (1 - market_price)

    # Cap at half-Kelly for safety
    position_size = min(kelly * 0.5, 0.10) * bankroll  # Max 10% of bankroll

    side = "YES" if edge > 0 else "NO"
    price = market_price if side == "YES" else (1 - market_price)

    return {
        "action": f"BUY {side}",
        "edge": edge,
        "kelly_full": kelly,
        "kelly_half": kelly * 0.5,
        "position_size": position_size,
        "contracts": int(position_size / price)
    }
```

**2. Correlation Hedge (Multi-Leg Spread)**
```python
def correlation_hedge(
    primary_game: dict,
    hedge_game: dict,
    correlation: float  # 0-1, how correlated are outcomes?
) -> dict:
    """
    Example: Long Georgia to win SEC, hedge with short Georgia CFP
    If Georgia loses SEC, both positions offset
    If Georgia wins SEC but loses CFP, net positive

    Analogous to: Calendar spread or diagonal spread
    """
    # Position 1: Primary thesis
    leg1 = {
        "game": primary_game["id"],
        "contract": primary_game["contract"],
        "side": "YES",
        "price": primary_game["price"],
        "expected_profit": primary_game["edge"] * 100
    }

    # Position 2: Hedge (correlated outcome)
    # Size hedge based on correlation
    hedge_size_ratio = correlation * 0.8  # 80% of correlated risk

    leg2 = {
        "game": hedge_game["id"],
        "contract": hedge_game["contract"],
        "side": "NO",  # Opposite direction
        "price": 1 - hedge_game["price"],
        "size_ratio": hedge_size_ratio
    }

    return {
        "strategy": "CORRELATION_HEDGE",
        "legs": [leg1, leg2],
        "net_exposure": 1 - hedge_size_ratio,
        "max_loss": leg1["price"] * (1 - hedge_size_ratio),
        "max_gain": (1 - leg1["price"]) + leg2["price"] * hedge_size_ratio
    }
```

**3. Live Game Momentum Trading (Theta Capture)**
```python
def momentum_trade(
    pre_game_price: float,
    current_price: float,
    game_state: dict,  # score, time remaining, possession
    model_fair_price: float  # Based on win probability model
) -> dict:
    """
    Capitalize on market overreaction during live games

    Analogous to: Selling options during IV expansion,
                  buying during IV crush
    """
    market_move = current_price - pre_game_price
    fair_move = model_fair_price - pre_game_price

    # Overreaction: market moved more than fundamentals justify
    overreaction = market_move - fair_move

    if abs(overreaction) > 0.05:  # 5% overreaction threshold
        if overreaction > 0:
            # Market too bullish, fade the move
            return {
                "action": "SELL (buy NO)",
                "overreaction": overreaction,
                "thesis": "Market overreacted to positive news"
            }
        else:
            # Market too bearish, buy the dip
            return {
                "action": "BUY YES",
                "overreaction": overreaction,
                "thesis": "Market overreacted to negative news"
            }

    return {"action": "HOLD", "reason": "No significant overreaction"}
```

### 6.3 Position Sizing Framework

```python
class PositionSizer:
    """
    Apply options-style risk management to prediction markets
    """

    def __init__(self, bankroll: float, max_single_position: float = 0.05):
        self.bankroll = bankroll
        self.max_single_position = max_single_position  # 5% default
        self.max_total_exposure = 0.30  # 30% max deployed

    def kelly_criterion(self, probability: float, odds_price: float) -> float:
        """
        Optimal bet size based on edge and probability

        For binary contracts:
        f* = (p * (1-price) - (1-p) * price) / (1-price)

        where p = your probability, price = contract cost
        """
        if probability <= odds_price:
            return 0  # No edge

        numerator = probability * (1 - odds_price) - (1 - probability) * odds_price
        denominator = 1 - odds_price

        return numerator / denominator

    def calculate_position_size(
        self,
        probability: float,
        contract_price: float,
        confidence: str = "medium"  # "low", "medium", "high"
    ) -> dict:
        """
        Final position size with safety adjustments
        """
        kelly = self.kelly_criterion(probability, contract_price)

        # Kelly fraction based on confidence
        kelly_multipliers = {
            "low": 0.25,
            "medium": 0.50,
            "high": 0.75
        }
        adjusted_kelly = kelly * kelly_multipliers[confidence]

        # Apply caps
        position_pct = min(
            adjusted_kelly,
            self.max_single_position,
            self.max_total_exposure  # Would need to track existing exposure
        )

        position_dollars = position_pct * self.bankroll
        num_contracts = int(position_dollars / contract_price)

        return {
            "full_kelly": kelly,
            "adjusted_kelly": adjusted_kelly,
            "final_position_pct": position_pct,
            "position_dollars": position_dollars,
            "num_contracts": num_contracts,
            "max_loss": num_contracts * contract_price,
            "max_gain": num_contracts * (1 - contract_price)
        }
```

---

## 7. UI/UX Design Guidelines

### 7.1 Design Principles

1. **Information Density:** Traders need data at a glance, but not overwhelmed
2. **Real-time Feedback:** Visual indicators update instantly with data
3. **Progressive Disclosure:** Basic view by default, details on demand
4. **Color Coding:**
   - Green: Positive edge, winning positions, bullish
   - Red: Negative edge, losing positions, bearish
   - Yellow/Amber: Caution, near breakeven, updating
   - Blue: Neutral information, historical data

### 7.2 Key UI Components

**1. Edge Gauge (Probability Visualization)**
```
          YOUR ESTIMATE: 68%
    ┌─────────────────────────────┐
    │    ╱‾‾‾‾‾‾‾‾‾‾‾‾╲          │
    │   ╱              ╲         │
    │  │   RED  │ YEL │ GREEN │  │
    │  │  0-40  │40-55│ 55-100│  │
    │   ╲       ▲     ╱          │
    │    ╲______│____╱           │
    │           │                │
    │      MARKET: 60%           │
    └─────────────────────────────┘
           EDGE: +8%
```

**2. Bayesian Update Chain**
```
Base Rate    Evidence 1     Evidence 2     Current
   57%   ──────▶ 62%   ──────▶ 68%   ────▶  68%
   │              │              │
   │ Home field   │ Star QB out  │ (no more updates)
   │ advantage    │ for opponent │
   │ LR: 1.15     │ LR: 1.20     │
```

**3. Position P&L Chart**
```
     +$20 │                          ╱
          │                        ╱
     +$10 │                      ╱
          │                    ╱
      $0  │──────────────────●────────────────
          │                ╱
    -$10  │              ╱
          │            ╱
    -$20  │──────────╱
          └────────────────────────────────────
            $0.30    $0.50    $0.70    $0.90
                   Contract Price

            Entry: $0.55 (100 contracts)
            Current: $0.62
            P&L: +$7.00
```

### 7.3 Responsive Layout

**Desktop (1200px+):**
- 3-column layout: Games list | Selected game detail | Portfolio sidebar
- Full analytics dashboard with all charts

**Tablet (768-1199px):**
- 2-column layout: Games list | Game detail (portfolio slides in)
- Condensed charts

**Mobile (< 768px):**
- Single column, tabbed navigation
- Swipe between: Dashboard | Analyze | Portfolio | Performance
- Simplified visualizations

---

## 8. Implementation Phases

### Phase 1: MVP

**Goal:** Basic functionality with manual data entry fallback

**Features:**
- [ ] User authentication (Clerk)
- [ ] Live scoreboard from ESPN API
- [ ] Basic odds display from The Odds API
- [ ] Edge calculator (user enters probabilities manually)
- [ ] Simple position tracker (manual entry)
- [ ] Basic P&L display

**Tech Deliverables:**
- Next.js app with basic routing
- FastAPI backend with ESPN/Odds integration
- PostgreSQL database for users and positions
- Redis cache for live data
- WebSocket for real-time updates

### Phase 2: Analytics Core

**Goal:** Full superforecaster toolkit

**Features:**
- [ ] Bayesian workbench with update chain
- [ ] Reference class database (historical base rates)
- [ ] Position sizing calculator (Kelly Criterion)
- [ ] Strategy simulator with multi-leg positions
- [ ] Calibration tracking and Brier scores

**Tech Deliverables:**
- Historical data pipeline (ingest past seasons)
- Bayesian calculation engine
- Enhanced visualization components (D3.js)
- Performance analytics dashboard

### Phase 3: Advanced Features

**Goal:** Options-style trading features

**Features:**
- [ ] Correlation hedge builder
- [ ] Live game momentum trading alerts
- [ ] "IV Crush" analog detector (kickoff price compression)
- [ ] Multi-book arbitrage scanner
- [ ] Custom alert system (edge thresholds, price targets)

**Tech Deliverables:**
- Real-time analytics engine
- Alert/notification system
- Advanced charting (payoff diagrams)
- API rate limit optimization

### Phase 4: Polish and Scale

**Goal:** Production-ready, scalable

**Features:**
- [ ] Mobile-optimized UI
- [ ] Push notifications
- [ ] Social sharing of picks (optional)
- [ ] Export capabilities (CSV, API)
- [ ] Advanced filtering and search

**Tech Deliverables:**
- Performance optimization
- CDN integration
- Monitoring and alerting
- Documentation

---

## 9. Risk Considerations and Mitigations

### 9.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| ESPN API changes/breaks | High | Cache last known data, fallback to manual entry |
| Odds API rate limits | Medium | Aggressive caching, batch requests, upgrade tier |
| WebSocket disconnects | Medium | Auto-reconnect logic, display "data may be delayed" |
| Database performance | Low | Index optimization, Redis caching, pagination |

### 9.2 User Experience Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Information overload | High | Progressive disclosure, sensible defaults |
| Analysis paralysis | Medium | Clear recommendations, suggested actions |
| Overconfidence from tools | High | Display uncertainty, require confidence intervals |

### 9.3 Legal/Compliance Considerations

- This is an analysis tool, not a brokerage
- Users execute trades on external platforms (Robinhood, Kalshi)
- No financial advice is provided
- Clear disclaimers on all recommendations
- State-by-state availability varies for prediction markets

---

## 10. Success Metrics

### 10.1 User Engagement
- Daily Active Users (DAU)
- Session duration
- Features used per session
- Return rate (weekly)

### 10.2 Forecasting Quality
- Average Brier score of users
- Calibration improvement over time
- Edge capture rate (realized vs expected)

### 10.3 Technical Performance
- API response times < 100ms
- WebSocket latency < 500ms
- Uptime > 99.5%
- Data freshness < 30 seconds

---

## 11. Related Documentation

This design document builds upon the research from:

1. **01-robinhood-prediction-markets.md** - Core reference for prediction market mechanics, contract pricing ($0.01-$0.99), fee structure, and trading strategies

2. **02-college-football-odds-and-apis.md** - API integration details including ESPN hidden API endpoints, The Odds API structure, polling intervals, and data transformation code

3. **03a-options-fundamentals-tools.md** - Greeks definitions and calculations that map to prediction market equivalents (Delta, Theta, Vega analogs)

4. **03b-options-strategic-view.md** - High-level strategic framework for when/why to use each strategy based on market outlook

5. **03c-options-methodology.md** - Implementation framework for the four-phase trade methodology (Analysis, Strategy Selection, Execution, Management)

---

## 12. Conclusion

This design document outlines a comprehensive college football prediction app that bridges superforecaster methodology with options-trading-inspired strategies for Robinhood prediction markets. The key differentiators are:

1. **Analytical Rigor:** Bayesian updating, base rate anchoring, calibration tracking
2. **Options Framework:** Position sizing, edge calculation, correlation hedging
3. **Real-time Integration:** Live scores and odds with instant edge calculations
4. **Disciplined Execution:** Risk management tools, portfolio tracking, performance analytics

The phased implementation approach allows for iterative development while delivering value at each stage.

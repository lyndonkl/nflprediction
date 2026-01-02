# College Football Odds and Data APIs: Complete Reference Guide

## Overview

**Topic**: Understanding College Football Betting Odds and Accessing Real-Time Data
**Purpose**: Foundation document for building a college football prediction/trading application
**Last Updated**: January 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Abstraction Ladder: Three Levels of Understanding](#abstraction-ladder-three-levels-of-understanding)
3. [Odds Format Reference](#odds-format-reference)
4. [API Landscape](#api-landscape)
5. [Data Architecture Strategies](#data-architecture-strategies)
6. [Implementation Recommendations](#implementation-recommendations)
7. [Edge Cases and Considerations](#edge-cases-and-considerations)
8. [Sources](#sources)

---

## Executive Summary

To build our college football prediction app, we need two types of data:
1. **Live Odds Data**: Current betting lines from sportsbooks (for comparison with Robinhood/Kalshi)
2. **Live Scores/Stats**: Real-time game information and play-by-play

**Key Findings:**
- **Best Free Odds API**: The Odds API (500 free requests/month, NCAAF coverage)
- **Best Free Scores API**: ESPN Hidden API (no auth required, real-time scores)
- **Architecture Recommendation**: Polling for scores (5-10s intervals), REST for odds (30s-60s intervals)
- **Conversion Formula**: American odds → Implied probability is critical for comparing to Robinhood's $0.XX prices

---

## Abstraction Ladder: Three Levels of Understanding

### Level 1 (Fundamental): What Odds Mean and Types of Bets

**Universal Principle: "Odds represent the market's assessment of probability, expressed as potential payouts"**

#### The Three Core Bet Types

Every college football game offers three fundamental betting markets:

```
GAME: #1 Georgia vs #4 Alabama
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BET TYPE        GEORGIA              ALABAMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MONEYLINE       -150 (Favorite)      +130 (Underdog)
  SPREAD          -3.5                 +3.5
  TOTAL (O/U)     Over 52.5            Under 52.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 1. Moneyline (Who Wins?)

The simplest bet: pick which team wins the game outright.

| Symbol | Meaning | Example | Interpretation |
|--------|---------|---------|----------------|
| **-** (Minus) | Favorite | -150 | Bet $150 to win $100 |
| **+** (Plus) | Underdog | +130 | Bet $100 to win $130 |

**Key Intuition**: The minus sign means "you pay more to win less" because the outcome is more likely.

#### 2. Spread (By How Much?)

The spread "levels the playing field" by giving the underdog a head start.

```
Georgia -3.5 vs Alabama +3.5

This means:
• Georgia must win by 4+ points to "cover" the spread
• Alabama can lose by up to 3 points and still "cover"
• If Georgia wins 24-21 (by 3), Alabama covers (+3.5 > 3)
• If Georgia wins 28-21 (by 7), Georgia covers (-3.5 + 7 = 3.5 margin)
```

**Why .5 (The Hook)?** Half-points eliminate ties (pushes). A 3-point margin can't push on a 3.5 spread.

#### 3. Total / Over-Under (Combined Score)

Betting on whether both teams' combined score exceeds a number.

```
Total: 52.5

• Over 52.5: Combined score must be 53+ to win
• Under 52.5: Combined score must be 52 or less to win
• Final score Georgia 31, Alabama 24 = 55 total → Over wins
```

**Key Insight**: Doesn't matter who scores—only the total matters.

#### The Mental Model: Odds as Probability

At its core, every betting line implies a probability:

```
Higher risk (unlikely outcome) = Higher reward (+odds)
Lower risk (likely outcome) = Lower reward (-odds)

Think of it like this:
  • -300 = "Almost certain" (bet $300 to win $100)
  • -110 = "Coin flip with vig" (bet $110 to win $100)
  • +200 = "Unlikely" (bet $100 to win $200)
  • +500 = "Long shot" (bet $100 to win $500)
```

---

### Level 2 (Intermediate): Odds Formats, Probability Conversion, and API Landscape

#### Odds Formats: American, Decimal, and Fractional

Different regions use different odds formats. Understanding conversions is critical for our app.

| Format | Example | Interpretation | Primary Region |
|--------|---------|----------------|----------------|
| **American** | -150 / +130 | Bet $150 to win $100 / Bet $100 to win $130 | USA |
| **Decimal** | 1.67 / 2.30 | Total return per $1 bet (including stake) | Europe, Australia |
| **Fractional** | 2/3 / 13/10 | Profit per unit staked | UK |

#### The Critical Formula: American Odds → Implied Probability

**This is essential for comparing sportsbook odds to Robinhood contract prices.**

```python
def american_to_probability(odds):
    """Convert American odds to implied probability (0-1 scale)"""
    if odds > 0:  # Positive odds (underdog)
        return 100 / (odds + 100)
    else:  # Negative odds (favorite)
        return abs(odds) / (abs(odds) + 100)

# Examples:
american_to_probability(-150)  # → 0.60 (60%)
american_to_probability(+130)  # → 0.435 (43.5%)
american_to_probability(-110)  # → 0.524 (52.4%)
american_to_probability(+200)  # → 0.333 (33.3%)
```

#### Implied Probability → Robinhood Price

```python
def probability_to_robinhood_price(prob):
    """Convert probability to expected Robinhood YES contract price"""
    # Robinhood prices are $0.01 to $0.99
    return round(prob, 2)  # Simple: 60% → $0.60

# Example flow:
# Sportsbook: Georgia -150 → 60% → Robinhood should be ~$0.60 for Georgia YES
# If Robinhood shows Georgia YES at $0.55 → Potential edge of $0.05 (5%)
```

#### The Vig (Vigorish/Juice): Why Probabilities Sum > 100%

```
Both sides at -110:
  Implied probability: 52.4% + 52.4% = 104.8%

The extra 4.8% is the bookmaker's profit margin (vig).

To calculate "true" probability, remove the vig:
  True probability = Implied probability / Sum of all probabilities
  Example: 52.4% / 104.8% = 50% (fair coin flip)
```

#### Complete Conversion Reference

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ODDS CONVERSION CHEAT SHEET                        │
├──────────────┬──────────────┬──────────────┬──────────────────────────┤
│   AMERICAN   │   DECIMAL    │  FRACTIONAL  │  IMPLIED PROBABILITY     │
├──────────────┼──────────────┼──────────────┼──────────────────────────┤
│    -500      │    1.20      │    1/5       │        83.3%             │
│    -300      │    1.33      │    1/3       │        75.0%             │
│    -200      │    1.50      │    1/2       │        66.7%             │
│    -150      │    1.67      │    2/3       │        60.0%             │
│    -110      │    1.91      │   10/11      │        52.4%             │
│    +100      │    2.00      │    1/1       │        50.0%             │
│    +110      │    2.10      │   11/10      │        47.6%             │
│    +150      │    2.50      │    3/2       │        40.0%             │
│    +200      │    3.00      │    2/1       │        33.3%             │
│    +300      │    4.00      │    3/1       │        25.0%             │
│    +500      │    6.00      │    5/1       │        16.7%             │
│   +1000      │   11.00      │   10/1       │         9.1%             │
└──────────────┴──────────────┴──────────────┴──────────────────────────┘
```

#### API Landscape Overview

| API | Free Tier | Odds Data | Scores Data | Rate Limit | Auth |
|-----|-----------|-----------|-------------|------------|------|
| **The Odds API** | 500 req/mo | Yes (40+ books) | No | Per plan | API Key |
| **ESPN API** | Unlimited* | No | Yes | Unofficial | None |
| **NCAA API** | Unlimited* | No | Yes | Unofficial | None |
| **SportsDataIO** | Trial | Yes | Yes | Limited | API Key |
| **Kalshi API** | Unknown | Yes (own) | No | Unknown | Auth |

*Unofficial/undocumented APIs with no guaranteed availability

---

### Level 3 (Advanced): Data Architecture and Implementation

#### Architecture Decision: Polling vs WebSocket

```
┌────────────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS PATTERNS                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  POLLING (REST)                    WEBSOCKET                          │
│  ═══════════════                   ═════════                          │
│                                                                        │
│  Client ──► Server                 Client ◄══► Server                 │
│    │          │                      │           │                    │
│    │ Request  │                      │ Handshake │                    │
│    ├─────────►│                      ├──────────►│                    │
│    │ Response │                      │◄──────────┤                    │
│    │◄─────────┤                      │           │                    │
│    │          │                      │  Push     │                    │
│    │ (wait)   │                      │◄──────────┤                    │
│    │          │                      │  Push     │                    │
│    │ Request  │                      │◄──────────┤                    │
│    ├─────────►│                      │  (continuous)                  │
│    │ Response │                      │                                │
│    │◄─────────┤                                                       │
│                                                                        │
│  Pros:                             Pros:                              │
│  • Simple implementation           • Real-time updates (<1s)          │
│  • Works everywhere                • Lower bandwidth                  │
│  • Easy caching                    • Server pushes data              │
│  • Stateless                       • No wasted requests              │
│                                                                        │
│  Cons:                             Cons:                              │
│  • Wastes requests (no change)     • Complex implementation           │
│  • Higher latency (interval)       • Connection management            │
│  • More bandwidth                  • Not all APIs support it          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Our Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED DATA ARCHITECTURE                        │
│                                                                         │
│   ┌─────────────┐                              ┌─────────────────────┐  │
│   │   CLIENT    │                              │      BACKEND        │  │
│   │  (React)    │                              │    (Node/Python)    │  │
│   └──────┬──────┘                              └──────────┬──────────┘  │
│          │                                                │             │
│          │  WebSocket (local)                             │             │
│          ├────────────────────────────────────────────────┤             │
│          │                                                │             │
│          │  Real-time scores                              │  Polling    │
│          │  every 5-10 seconds                            ├────────────►│
│          │                                                │             │
│          │  Odds updates                                  │  ESPN API   │
│          │  every 30-60 seconds                           │  (5-10s)    │
│          │                                                │             │
│          │  Alert notifications                           ├────────────►│
│          │  (threshold crossed)                           │             │
│          │                                                │  Odds API   │
│                                                           │  (30-60s)   │
│                                                           │             │
│                                                           └─────────────┘
│                                                                         │
│   WHY THIS ARCHITECTURE:                                                │
│   • Client doesn't hit external APIs directly (CORS, rate limits)       │
│   • Backend aggregates and caches data                                  │
│   • WebSocket to client = instant UI updates                            │
│   • Polling to external APIs = respects their rate limits               │
│   • Can add Redis cache for horizontal scaling                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### API Integration Details

##### 1. ESPN Hidden API (Live Scores)

```javascript
// ESPN College Football Scoreboard
const ENDPOINTS = {
  // Get all FBS games for a date
  scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',

  // Get specific game details
  summary: (gameId) =>
    `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`,

  // Get team info
  team: (teamId) =>
    `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}`,

  // Get rankings
  rankings: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings'
};

// Query Parameters
// ?dates=20260101 - specific date (YYYYMMDD)
// ?dates=20260101-20260108 - date range
// ?groups=80 - all FBS games (default is Top 25 only)
// ?groups=8 - SEC conference only
// ?groups=4 - Big 12 only

// Example response structure (scoreboard)
{
  "events": [
    {
      "id": "401628430",
      "name": "Georgia Bulldogs at Alabama Crimson Tide",
      "shortName": "UGA @ ALA",
      "date": "2026-01-01T20:00Z",
      "competitions": [{
        "competitors": [
          { "team": { "abbreviation": "ALA" }, "score": "21", "homeAway": "home" },
          { "team": { "abbreviation": "UGA" }, "score": "28", "homeAway": "away" }
        ],
        "status": {
          "type": { "state": "in", "completed": false },
          "period": 3,
          "displayClock": "8:42"
        }
      }]
    }
  ]
}
```

##### 2. The Odds API (Betting Lines)

```javascript
// The Odds API - College Football
const ODDS_API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://api.the-odds-api.com/v4';

const ENDPOINTS = {
  // List available sports
  sports: `${BASE_URL}/sports?apiKey=${ODDS_API_KEY}`,

  // Get NCAAF odds
  ncaafOdds: (markets = 'h2h,spreads,totals') =>
    `${BASE_URL}/sports/americanfootball_ncaaf/odds?regions=us&markets=${markets}&oddsFormat=american&apiKey=${ODDS_API_KEY}`,

  // Get specific event odds (more markets available)
  eventOdds: (eventId) =>
    `${BASE_URL}/sports/americanfootball_ncaaf/events/${eventId}/odds?regions=us&oddsFormat=american&apiKey=${ODDS_API_KEY}`
};

// Available markets:
// - h2h: Moneyline (head-to-head)
// - spreads: Point spread
// - totals: Over/under
// - outrights: Futures (championship winner)
// - player_props: (via event-odds endpoint)

// Example response structure
{
  "id": "a1b2c3d4e5",
  "sport_key": "americanfootball_ncaaf",
  "sport_title": "NCAAF",
  "commence_time": "2026-01-01T20:00:00Z",
  "home_team": "Alabama Crimson Tide",
  "away_team": "Georgia Bulldogs",
  "bookmakers": [
    {
      "key": "draftkings",
      "title": "DraftKings",
      "markets": [
        {
          "key": "h2h",
          "outcomes": [
            { "name": "Alabama Crimson Tide", "price": 130 },
            { "name": "Georgia Bulldogs", "price": -150 }
          ]
        },
        {
          "key": "spreads",
          "outcomes": [
            { "name": "Alabama Crimson Tide", "price": -110, "point": 3.5 },
            { "name": "Georgia Bulldogs", "price": -110, "point": -3.5 }
          ]
        },
        {
          "key": "totals",
          "outcomes": [
            { "name": "Over", "price": -110, "point": 52.5 },
            { "name": "Under", "price": -110, "point": 52.5 }
          ]
        }
      ]
    },
    {
      "key": "fanduel",
      "title": "FanDuel",
      // ... similar structure
    }
  ]
}
```

##### 3. Credit Usage Strategy (The Odds API)

```
Free Tier: 500 credits/month

Credit Consumption:
• 1 request = 1 credit (regardless of response size)
• Each sport + market combination = 1 request

Optimization Strategy:
┌────────────────────────────────────────────────────────────────────┐
│  SCENARIO                              CREDITS/DAY    CREDITS/MO   │
├────────────────────────────────────────────────────────────────────┤
│  Poll every 5 min, game days (8 games) │                          │
│  = 12 requests/hour × 5 hours × 8 days │    60          480       │
│                                                                    │
│  Poll every 30 sec during live games   │                          │
│  = 120 requests/hour × 3 hours × 4 wks │    360       ~1,440      │
│  (EXCEEDS FREE TIER)                                               │
│                                                                    │
│  RECOMMENDED: Poll every 60 sec        │                          │
│  = 60 requests/hour × 3 hours × 4 wks  │    180         720       │
│  (Requires paid tier: $30/mo for 20K)                              │
└────────────────────────────────────────────────────────────────────┘
```

#### Data Transformation Pipeline

```python
# Complete data transformation for our app

import requests
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class GameOdds:
    game_id: str
    home_team: str
    away_team: str
    commence_time: str

    # Moneyline
    home_ml: int  # American odds
    away_ml: int
    home_ml_prob: float  # Implied probability
    away_ml_prob: float

    # Spread
    home_spread: float
    away_spread: float
    spread_price: int

    # Total
    total_line: float
    over_price: int
    under_price: int

    # Robinhood comparison
    home_robinhood_expected: float  # Expected price on Robinhood
    away_robinhood_expected: float


def american_to_probability(odds: int) -> float:
    """Convert American odds to implied probability."""
    if odds > 0:
        return 100 / (odds + 100)
    else:
        return abs(odds) / (abs(odds) + 100)


def remove_vig(prob1: float, prob2: float) -> tuple[float, float]:
    """Remove bookmaker's vig to get fair probabilities."""
    total = prob1 + prob2
    return prob1 / total, prob2 / total


def transform_odds_response(api_response: dict) -> GameOdds:
    """Transform raw API response to our app's data model."""

    # Get first bookmaker (or aggregate across all)
    bookmaker = api_response['bookmakers'][0]

    # Find markets
    h2h = next(m for m in bookmaker['markets'] if m['key'] == 'h2h')
    spreads = next(m for m in bookmaker['markets'] if m['key'] == 'spreads')
    totals = next(m for m in bookmaker['markets'] if m['key'] == 'totals')

    # Extract values
    home_ml = next(o['price'] for o in h2h['outcomes']
                   if o['name'] == api_response['home_team'])
    away_ml = next(o['price'] for o in h2h['outcomes']
                   if o['name'] == api_response['away_team'])

    # Calculate probabilities
    home_prob = american_to_probability(home_ml)
    away_prob = american_to_probability(away_ml)
    home_fair, away_fair = remove_vig(home_prob, away_prob)

    return GameOdds(
        game_id=api_response['id'],
        home_team=api_response['home_team'],
        away_team=api_response['away_team'],
        commence_time=api_response['commence_time'],

        home_ml=home_ml,
        away_ml=away_ml,
        home_ml_prob=round(home_prob, 3),
        away_ml_prob=round(away_prob, 3),

        home_spread=next(o['point'] for o in spreads['outcomes']
                        if o['name'] == api_response['home_team']),
        away_spread=next(o['point'] for o in spreads['outcomes']
                        if o['name'] == api_response['away_team']),
        spread_price=-110,  # Typically -110 on both sides

        total_line=totals['outcomes'][0]['point'],
        over_price=next(o['price'] for o in totals['outcomes'] if o['name'] == 'Over'),
        under_price=next(o['price'] for o in totals['outcomes'] if o['name'] == 'Under'),

        # Expected Robinhood prices (fair probability)
        home_robinhood_expected=round(home_fair, 2),
        away_robinhood_expected=round(away_fair, 2)
    )


# Example usage
"""
game = transform_odds_response(api_data)

# Now compare to Robinhood
robinhood_home_yes = 0.58  # Actual Robinhood price

edge = game.home_robinhood_expected - robinhood_home_yes
# If edge > 0.03 (3%), potential opportunity

print(f"Expected: ${game.home_robinhood_expected:.2f}")
print(f"Robinhood: ${robinhood_home_yes:.2f}")
print(f"Edge: {edge * 100:.1f}%")
"""
```

---

## Odds Format Reference

### Quick Conversion Formulas

```python
# American to Decimal
def american_to_decimal(american):
    if american > 0:
        return (american / 100) + 1
    else:
        return (100 / abs(american)) + 1

# Decimal to American
def decimal_to_american(decimal):
    if decimal >= 2.0:
        return int((decimal - 1) * 100)
    else:
        return int(-100 / (decimal - 1))

# American to Probability
def american_to_probability(american):
    if american > 0:
        return 100 / (american + 100)
    else:
        return abs(american) / (abs(american) + 100)

# Probability to American
def probability_to_american(prob):
    if prob >= 0.5:
        return int(-100 * prob / (1 - prob))
    else:
        return int(100 * (1 - prob) / prob)
```

---

## API Landscape

### Detailed API Comparison

#### The Odds API (Recommended for Odds)

| Feature | Details |
|---------|---------|
| **Free Tier** | 500 requests/month |
| **Paid Tiers** | $30/mo (20K), $59/mo (100K), $119/mo (5M) |
| **NCAAF Coverage** | Yes (`americanfootball_ncaaf`) |
| **Markets** | Moneyline, Spread, Total, Props |
| **Bookmakers** | 40+ (DraftKings, FanDuel, BetMGM, etc.) |
| **Historical Data** | Yes (paid plans, from mid-2020) |
| **Odds Formats** | American, Decimal |
| **Authentication** | API Key (URL parameter) |
| **Rate Limit** | Per credit balance |
| **Documentation** | [the-odds-api.com](https://the-odds-api.com/) |

#### ESPN API (Recommended for Scores)

| Feature | Details |
|---------|---------|
| **Cost** | Free (unofficial/undocumented) |
| **Authentication** | None required |
| **NCAAF Coverage** | Complete FBS/FCS |
| **Data Types** | Scores, schedules, teams, rankings |
| **Real-time** | Yes (live scores) |
| **Rate Limit** | Undocumented (be respectful) |
| **Risk** | Could break without notice |
| **Documentation** | [Community GitHub Gist](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) |

#### SportsDataIO (Alternative)

| Feature | Details |
|---------|---------|
| **Free Tier** | Trial only |
| **Paid** | Custom pricing |
| **Coverage** | Comprehensive (scores, odds, stats) |
| **Best For** | Production apps needing SLA |

---

## Data Architecture Strategies

### Strategy 1: Simple Polling (Recommended for MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                  SIMPLE POLLING ARCHITECTURE                    │
│                                                                 │
│   setInterval(() => {                                           │
│     fetchScores();   // Every 5-10 seconds                      │
│     fetchOdds();     // Every 30-60 seconds                     │
│   }, interval);                                                 │
│                                                                 │
│   PROS:                        CONS:                            │
│   • Simple to implement        • Wastes some requests           │
│   • Easy to debug              • Not truly real-time            │
│   • Works with any API         • Client-side rate limit mgmt    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Strategy 2: Backend with WebSocket (Recommended for Production)

```
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND + WEBSOCKET ARCHITECTURE                   │
│                                                                 │
│   Frontend (React)                                              │
│       │                                                         │
│       │ WebSocket                                               │
│       ▼                                                         │
│   Backend (Node/Python)                                         │
│       │                                                         │
│       ├──► Cache (Redis) ◄──┤                                   │
│       │                      │                                  │
│       │ Polling (cron)       │ Background Jobs                  │
│       ▼                      ▼                                  │
│   [ESPN API]            [Odds API]                              │
│                                                                 │
│   Benefits:                                                     │
│   • Single source of truth                                      │
│   • Rate limit handled by backend                               │
│   • Can add data enrichment                                     │
│   • Horizontal scaling possible                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Strategy 3: Hybrid with Premium WebSocket

```
For production apps requiring <1s latency:
• Use premium API with WebSocket support (Unabated, MetaBet)
• Cost: $100-500+/month
• Latency: <100ms
• Best for: Arbitrage detection, live betting
```

---

## Implementation Recommendations

### For Our College Football App

#### Phase 1: MVP
- **Scores**: ESPN API, poll every 10 seconds during games
- **Odds**: The Odds API free tier, poll every 60 seconds
- **Architecture**: Simple client-side polling

#### Phase 2: Production
- **Scores**: ESPN API via backend caching
- **Odds**: The Odds API paid tier ($30/mo)
- **Architecture**: Backend with WebSocket to frontend
- **Cache**: Redis for odds/scores caching

#### Phase 3: Scale
- **Consider**: Premium WebSocket APIs if latency-critical
- **Add**: Kalshi direct integration if available
- **Enhance**: Historical data for backtesting

### Recommended Polling Intervals

| Data Type | Context | Interval | Reasoning |
|-----------|---------|----------|-----------|
| Live Scores | During game | 5-10 sec | Score changes infrequently |
| Live Scores | Pre-game | 60 sec | Game hasn't started |
| Odds | Pre-game | 60 sec | Odds move slowly |
| Odds | During game | 15-30 sec | Live odds move faster |
| Odds | Off-season | Daily | No games |

---

## Edge Cases and Considerations

### Edge Case 1: Line Movement Alert

**Scenario**: Odds move significantly (3+ points) in short time.

**Implementation**:
```javascript
// Track line movement
const detectLineMove = (current, previous) => {
  const spreadChange = Math.abs(current.homeSpread - previous.homeSpread);
  const mlChange = Math.abs(
    american_to_probability(current.homeML) -
    american_to_probability(previous.homeML)
  );

  if (spreadChange >= 3 || mlChange >= 0.10) {
    return { alert: true, type: 'SIGNIFICANT_LINE_MOVE' };
  }
  return { alert: false };
};
```

### Edge Case 2: API Rate Limit Exceeded

**Scenario**: Hit rate limit during live game.

**Mitigation**:
- Implement exponential backoff
- Cache last known data
- Show "data may be delayed" warning
- Queue requests for when limit resets

### Edge Case 3: Odds Discrepancy Between Books

**Scenario**: DraftKings shows -150, FanDuel shows -140.

**Implementation**:
```javascript
// Aggregate odds across bookmakers
const aggregateOdds = (bookmakers, market, team) => {
  const odds = bookmakers.map(b => {
    const m = b.markets.find(m => m.key === market);
    return m?.outcomes.find(o => o.name === team)?.price;
  }).filter(Boolean);

  return {
    best: Math.max(...odds),  // Best odds for bettor
    worst: Math.min(...odds),
    average: odds.reduce((a,b) => a+b, 0) / odds.length,
    consensus: odds // All available
  };
};
```

---

## Sources

### APIs
- [The Odds API](https://the-odds-api.com/)
- [The Odds API - NCAAF Documentation](https://the-odds-api.com/sports-odds-data/ncaa-football-odds.html)
- [ESPN Hidden API Documentation](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [SportsDataIO - NCAAF](https://sportsdata.io/developers/api-documentation/ncaa-football)
- [NCAA API (GitHub)](https://github.com/henrygd/ncaa-api)

### Odds Education
- [Sports Illustrated - Betting 101](https://www.si.com/betting/2022/03/11/sports-betting-101-moneyline-over-under-odds-spreads-terminology)
- [The Lines - Implied Probability](https://www.thelines.com/calculate-implied-probability-american-betting-odds/)
- [FOX Sports - Spread Explained](https://www.foxsports.com/stories/nfl/point-spread-over-under)
- [BetMGM - NFL Betting Explained](https://sports.betmgm.com/en/blog/how-to-read-nfl-betting-odds-online-spread-over-under-money-line/)

### Architecture
- [RxDB - WebSockets vs Polling](https://rxdb.info/articles/websockets-sse-polling-webrtc-webtransport.html)
- [Ably - WebSocket vs REST](https://ably.com/topic/websocket-vs-rest)
- [Medium - Real-Time Sports Odds Tracker](https://medium.com/@ayoubennaoui20/how-to-build-a-real-time-sports-odds-tracker-with-fastapi-websockets-angular-part-1-ff2de71c62d5)

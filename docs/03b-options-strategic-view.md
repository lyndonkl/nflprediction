# Options Trading: Strategic View

## Overview

This document provides the **high-level strategic view** of options trading—understanding *when* and *why* to deploy specific strategies based on market outlook, volatility expectations, and risk/reward objectives. This is the "pattern recognition" layer that guides strategy selection.

---

## Part 1: The Strategic Decision Framework

### The Four Market Outlooks

Every options strategy starts with a view on two dimensions:

| Dimension | Possible Views |
|-----------|----------------|
| **Direction** | Bullish, Bearish, Neutral |
| **Volatility** | Expecting increase, Expecting decrease, No strong view |

This creates a **strategy selection matrix**:

```
                    VOLATILITY VIEW
                    ↑ Increase    ↓ Decrease    → Neutral
DIRECTION   ────────────────────────────────────────────────
VIEW        ↑ Bullish    Long Call      Bull Call     Covered Call
                         Long Straddle   Spread

            ↓ Bearish    Long Put       Bear Put      Cash-Secured
                         Long Strangle   Spread        Put

            → Neutral    Long Straddle  Iron Condor   Calendar
                         Long Strangle  Iron Butterfly Spread
```

### The Risk-Reward Spectrum

Strategies fall on a spectrum from aggressive to conservative:

**Aggressive (High Risk, High Reward)**
- Long calls/puts (unlimited upside, 100% capital at risk)
- Naked options (unlimited risk)

**Moderate (Balanced)**
- Vertical spreads (defined risk and reward)
- Straddles/strangles (defined risk, significant upside)

**Conservative (Lower Risk, Lower Reward)**
- Covered calls (income generation, limited upside)
- Cash-secured puts (acquisition strategy)
- Protective puts (portfolio insurance)

---

## Part 2: Core Strategic Patterns

### Pattern 1: Income Generation Strategies

**Strategic Purpose**: Generate consistent returns from existing positions or cash holdings

**When to Use**:
- You own stock you're willing to sell at a higher price → **Covered Call**
- You want to buy stock at a lower price and get paid to wait → **Cash-Secured Put**
- You believe a stock will trade sideways → **Iron Condor**

**Covered Call Strategy Profile**:
```
Outlook:     Mildly bullish to neutral
Max Profit:  Premium + (Strike - Stock Price)
Max Loss:    Stock Price - Premium (if stock goes to zero)
Break-even:  Stock Price - Premium Received
Best When:   Stock is range-bound or slowly rising
Avoid When:  Expecting strong upward move (caps your upside)
```

**Cash-Secured Put Strategy Profile**:
```
Outlook:     Neutral to mildly bullish
Max Profit:  Premium received
Max Loss:    Strike Price - Premium (if stock goes to zero)
Break-even:  Strike Price - Premium Received
Best When:   You want to buy the stock anyway at lower price
Avoid When:  Bearish on the stock (you might get assigned)
```

### Pattern 2: Directional Speculation

**Strategic Purpose**: Profit from anticipated price movement with leverage

**When to Use**:
- Strong conviction on direction, want limited risk → **Vertical Spreads**
- Strong conviction, want maximum leverage → **Long Calls/Puts**
- Moderate conviction, want some protection → **Debit Spreads**

**Bull Call Spread Strategy Profile**:
```
Outlook:     Moderately bullish
Max Profit:  (Higher Strike - Lower Strike) - Net Debit
Max Loss:    Net Debit paid
Break-even:  Lower Strike + Net Debit
Best When:   You expect move up but not explosive
Advantage:   Cheaper than long call, defined risk
Trade-off:   Capped upside
```

**Bear Put Spread Strategy Profile**:
```
Outlook:     Moderately bearish
Max Profit:  (Higher Strike - Lower Strike) - Net Debit
Max Loss:    Net Debit paid
Break-even:  Higher Strike - Net Debit
Best When:   You expect move down but not crash
Advantage:   Cheaper than long put, defined risk
Trade-off:   Capped profit if stock collapses
```

### Pattern 3: Volatility Plays

**Strategic Purpose**: Profit from changes in volatility regardless of direction

**When to Use**:
- Expecting big move, unsure of direction → **Long Straddle/Strangle**
- Expecting low volatility, range-bound → **Short Straddle/Iron Condor**
- Before known events (earnings, FDA decisions) → **Volatility strategies**

**Long Straddle Strategy Profile**:
```
Outlook:     Expecting large move, direction unknown
Max Profit:  Unlimited (in either direction)
Max Loss:    Total premium paid (both options)
Break-even:  Strike ± Total Premium
Best When:   Before major announcements, IV is low
Avoid When:  IV already elevated (expensive entry)
```

**Iron Condor Strategy Profile**:
```
Outlook:     Neutral, expecting low volatility
Max Profit:  Net credit received
Max Loss:    Width of spread - Credit
Break-even:  Two points (lower put strike + credit, upper call strike - credit)
Best When:   Range-bound markets, high IV (sell expensive options)
Avoid When:  Expecting breakout or major news
```

### Pattern 4: Hedging and Protection

**Strategic Purpose**: Protect existing positions from adverse moves

**When to Use**:
- Own stock, worried about downside → **Protective Put**
- Short stock, worried about upside → **Protective Call**
- Want to reduce cost of protection → **Collar**

**Protective Put Strategy Profile**:
```
Outlook:     Long-term bullish, short-term uncertain
Max Profit:  Unlimited (minus premium paid)
Max Loss:    Stock Price - Strike + Premium
Break-even:  Original stock price + Premium paid
Best When:   Protecting gains, uncertain near-term
Trade-off:   Premium cost reduces returns
```

**Collar Strategy Profile**:
```
Outlook:     Neutral, want protection at low/no cost
Max Profit:  Call Strike - Stock Price + Net Credit/Debit
Max Loss:    Stock Price - Put Strike - Net Credit/Debit
Best When:   Protecting gains, willing to cap upside
Trade-off:   Limited upside potential
```

---

## Part 3: Time-Based Strategy Selection

### Near-Term (0-30 Days)

**Favorable Strategies**:
- Selling premium (theta decay accelerates)
- Covered calls on range-bound stocks
- Iron condors if IV is elevated

**Avoid**:
- Buying long-dated options (overpaying for time)

### Medium-Term (30-90 Days)

**Favorable Strategies**:
- Vertical spreads (balance of time decay and flexibility)
- Calendar spreads
- LEAPS for long-term directional plays

**Considerations**:
- Balance between theta decay and time for thesis to play out

### Long-Term (90+ Days)

**Favorable Strategies**:
- LEAPS for equity replacement
- Protective puts for portfolio hedging
- Diagonal spreads

**Avoid**:
- Selling naked short-term options (too much risk over time)

---

## Part 4: Volatility-Based Strategy Selection

### When IV is High (Above Historical Average)

**Favorable Strategies**:
- **Sell premium**: Covered calls, cash-secured puts, iron condors
- Credit spreads over debit spreads
- Short straddles/strangles (with caution)

**Why**: Options are expensive, sellers are compensated well

### When IV is Low (Below Historical Average)

**Favorable Strategies**:
- **Buy premium**: Long calls/puts, debit spreads
- Long straddles/strangles before catalysts
- Calendar spreads (sell near-term, buy longer-term)

**Why**: Options are cheap, buyers get leverage at better prices

### Around Events (Earnings, FDA, etc.)

**Pre-Event**:
- Long straddles if IV hasn't spiked yet
- Avoid selling premium (IV crush helps sellers only after event)

**Post-Event**:
- IV typically crushes
- Consider selling premium immediately after

---

## Part 5: Capital Efficiency Considerations

### Strategy Capital Requirements

| Strategy | Capital Required | Capital Efficiency |
|----------|------------------|-------------------|
| Long Call/Put | Premium only | High leverage |
| Covered Call | Full stock price | Low (tied up in shares) |
| Cash-Secured Put | Strike × 100 | Low (tied up in cash) |
| Vertical Spread | Max loss amount | Moderate |
| Iron Condor | Width of wider spread | Moderate |

### Sizing Principles

1. **Never risk more than 2-5% of portfolio on a single trade**
2. **Defined-risk strategies** allow precise position sizing
3. **Undefined-risk strategies** require larger capital buffers
4. **Correlation matters**: Don't have multiple positions that fail together

---

## Part 6: Strategy Selection Cheat Sheet

### Quick Reference: What Strategy for What Situation?

**"I think the stock will go up moderately"**
→ Bull Call Spread or Cash-Secured Put

**"I think the stock will go up significantly"**
→ Long Call or Bull Call Spread with wider strikes

**"I think the stock will go down moderately"**
→ Bear Put Spread

**"I think the stock will go down significantly"**
→ Long Put or Bear Put Spread with wider strikes

**"I own stock and want income"**
→ Covered Call

**"I want to buy stock cheaper"**
→ Cash-Secured Put

**"Big move coming, don't know direction"**
→ Long Straddle or Long Strangle

**"Stock will stay in a range"**
→ Iron Condor or Short Strangle

**"I need to protect my gains"**
→ Protective Put or Collar

**"Volatility is too high"**
→ Sell premium (covered call, credit spreads)

**"Volatility is too low"**
→ Buy premium (long options, debit spreads)

---

## Part 7: Application to Prediction Markets

### Mapping Options Strategies to Event Contracts

| Options Concept | Prediction Market Equivalent |
|-----------------|------------------------------|
| Long Call | Buy YES contract (bullish on outcome) |
| Long Put | Buy NO contract (bearish on outcome) |
| Covered Call | Own YES, willing to sell if price rises |
| Spread Strategy | Position in multiple related markets |
| IV Assessment | Compare contract price to estimated probability |
| Theta Decay | Time decay as event approaches |

### Strategic Insights for Event Contracts

1. **Premium Selling**: When contract prices seem too high relative to probability, sell (buy opposite side)

2. **Volatility Assessment**: Early in event timeline = more uncertainty = wider fair value range

3. **Directional Conviction**: Size positions based on conviction and edge estimation

4. **Hedging**: Take offsetting positions in correlated events

---

## Summary: The Strategic Mindset

Options strategy selection follows a systematic process:

1. **Assess Market Outlook**: Direction + Volatility expectation
2. **Evaluate IV Environment**: High IV favors sellers, low IV favors buyers
3. **Consider Time Horizon**: Match strategy to your timeframe
4. **Define Risk Tolerance**: Choose defined-risk vs. undefined-risk strategies
5. **Size Appropriately**: Risk consistent percentage of capital
6. **Monitor and Adjust**: Have exit plans for profit and loss scenarios

The next document (03c) covers the **methodology**—how to actually implement these strategies using the fundamental tools (Greeks) as your guide.

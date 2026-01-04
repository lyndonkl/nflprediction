# Fermi Decomposer

## Metadata

- **Agent ID**: `fermi-decomposer`
- **Version**: 1.0.0
- **Stage**: fermi_decomposition
- **Description**: Breaks down the prediction into independent sub-questions using Fermi estimation to cross-check base rate.
- **Timeout**: 60000 ms
- **Rate Limit**: 10/minute

## Capabilities

- **Supported Stages**: fermi_decomposition
- **Actions**: decomposition, probability_estimation, structural_analysis
- **Input Types**: game_context, base_rate
- **Output Types**: sub_questions, structural_estimate

## Coherence Profile

- **Semantic Domain**: analytical_reasoning
- **Frequency Tier**: gamma

## Input Variables

### Required
- `homeTeam`: Name of the home team
- `awayTeam`: Name of the away team
- `baseRate`: The calculated base rate probability from previous stage

### Optional
- `referenceClasses`: Array of reference class objects for additional context

## Output Format

```json
{
  "subQuestions": [
    {
      "question": "string - The sub-question",
      "probability": "number 0-1 - Estimated probability",
      "confidence": "number 0-1 - Confidence in the estimate",
      "reasoning": "string - Brief justification"
    }
  ],
  "structuralEstimate": "number - Product of all sub-question probabilities",
  "baseRateComparison": "string - How structural estimate compares to base rate",
  "reconciliation": "string - Explanation of any discrepancy"
}
```

## System Prompt

```
# Identity
You are an analytical forecaster using Fermi decomposition to cross-check probability estimates.

# Goal
Break down "Will the HOME TEAM win?" into 3-5 key factors and estimate the probability of each. The structural estimate (product of probabilities) serves as a CROSS-CHECK against the base rate.

# Important
- If structural estimate << base rate: factors may be too pessimistic or not independent
- If structural estimate >> base rate: factors may be too optimistic
- The reconciliation explains any significant discrepancy (>10%)

# Constraints
- Sub-questions should be as independent as possible
- Each probability should reflect genuine uncertainty (not all 0.9)
- Structural estimate naturally trends lower due to multiplication

# Output
Return valid JSON:
{
  "subQuestions": [{"question": "string", "probability": 0.XX, "confidence": 0.XX, "reasoning": "string"}],
  "structuralEstimate": 0.XX,
  "baseRateComparison": "string - how structural compares to base rate",
  "reconciliation": "string - explanation of discrepancy"
}
```

## User Prompt Template

```
Decompose the prediction: Will {{homeTeam}} (HOME TEAM) beat {{awayTeam}}?

<game>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <base_rate>{{baseRate}}</base_rate>
</game>

Break into 3-5 independent factors that determine HOME TEAM victory. Calculate structural estimate and compare to base rate {{baseRate}}.
```

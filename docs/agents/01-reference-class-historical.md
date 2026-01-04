# Reference Class Historical Finder

## Metadata

- **Agent ID**: `reference-class-historical`
- **Version**: 1.0.0
- **Stage**: reference_class
- **Description**: Finds historical reference classes to anchor probability estimates for college football predictions.
- **Timeout**: 60000 ms
- **Rate Limit**: 10/minute

## Capabilities

- **Supported Stages**: reference_class
- **Actions**: historical_search, pattern_matching
- **Input Types**: game_context
- **Output Types**: reference_class_list

## Coherence Profile

- **Semantic Domain**: historical_analysis
- **Frequency Tier**: gamma

## Input Variables

### Required
- `homeTeam`: Name of the home team
- `awayTeam`: Name of the away team
- `venue`: Game venue
- `conference`: Conference of the teams

### Optional
- `homeRanking`: Home team ranking
- `awayRanking`: Away team ranking
- `isRivalry`: Whether this is a rivalry game

## Output Format

```json
{
  "matches": [
    {
      "description": "string - Description of the reference class",
      "historicalSampleSize": "number - Estimated sample size",
      "relevanceScore": "number 0-1 - How relevant to current matchup",
      "category": "string - Category of reference class"
    }
  ],
  "reasoning": "string - Explanation of reference class selection",
  "recommendedClass": "string - Primary recommended reference class"
}
```

## System Prompt

```
# Identity
You are a sports historian finding reference classes for college football probability forecasting.

# Goal
Identify 3-5 historical reference classes to anchor the probability that the HOME TEAM wins. Each reference class represents a category of similar historical games.

# Constraints
- Focus on HOME TEAM win probability (not away team)
- Estimate sample sizes conservatively from your college football knowledge
- Score relevance 0-1 based on similarity to current matchup
- Include: head-to-head history, ranking differential, conference matchups, home favorite patterns
- Recommend the primary reference class for anchoring the base rate

# Output
Return valid JSON:
{
  "matches": [{"description": "string", "historicalSampleSize": number, "relevanceScore": 0-1, "category": "string"}],
  "reasoning": "string",
  "recommendedClass": "string"
}
```

## User Prompt Template

```
Find reference classes to estimate the probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}}.

<game>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <venue>{{venue}}</venue>
  <home_ranking>{{homeRanking | default("Unranked")}}</home_ranking>
  <away_ranking>{{awayRanking | default("Unranked")}}</away_ranking>
  <conference>{{conference}}</conference>
  <is_rivalry>{{isRivalry}}</is_rivalry>
</game>

Return 3-5 reference classes with estimated HOME TEAM win rates for each category.
```

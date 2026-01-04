# Superforecaster Agents

This directory contains documentation for all 10 agents in the superforecaster pipeline. Each agent is responsible for a specific stage of the forecasting process.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPERFORECASTER PIPELINE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

Stage 1: Reference Class
┌─────────────────────────────────┐
│  reference-class-historical     │ → Find similar historical matchups
└─────────────────────────────────┘
                │
                ▼
Stage 2: Base Rate
┌─────────────────────────────────┐
│  base-rate-calculator           │ → Calculate baseline probability
└─────────────────────────────────┘
                │
                ▼
Stage 3: Fermi Decomposition
┌─────────────────────────────────┐
│  fermi-decomposer               │ → Break into independent sub-questions
└─────────────────────────────────┘
                │
                ▼
Stage 4: Evidence Gathering (PARALLEL)
┌─────────────────────────────────┐
│  evidence-web-search            │ → Search web for game-specific news
├─────────────────────────────────┤
│  evidence-injury-analyzer       │ → Analyze injury reports
├─────────────────────────────────┤
│  contrarian-evidence-searcher   │ → Find disconfirming evidence
└─────────────────────────────────┘
                │
                ▼
Stage 5: Bayesian Update
┌─────────────────────────────────┐
│  bayesian-updater               │ → Update probability with evidence
└─────────────────────────────────┘
                │
                ▼
Stage 6: Premortem (PARALLEL)
┌─────────────────────────────────┐
│  devils-advocate                │ → Challenge the forecast
├─────────────────────────────────┤
│  bias-detector                  │ → Identify cognitive biases
└─────────────────────────────────┘
                │
                ▼
Stage 7: Synthesis
┌─────────────────────────────────┐
│  synthesis-coordinator          │ → Generate final probability estimate
└─────────────────────────────────┘
```

## Agent Summary

| # | Agent | Stage | Description |
|---|-------|-------|-------------|
| 1 | [reference-class-historical](./01-reference-class-historical.md) | reference_class | Finds similar historical matchups to anchor probability estimates |
| 2 | [base-rate-calculator](./02-base-rate-calculator.md) | base_rate | Calculates historical win probabilities from reference classes |
| 3 | [fermi-decomposer](./03-fermi-decomposer.md) | fermi_decomposition | Breaks predictions into independent sub-questions |
| 4 | [evidence-web-search](./04-evidence-web-search.md) | evidence_gathering | Searches web for relevant news and analysis |
| 5 | [evidence-injury-analyzer](./05-evidence-injury-analyzer.md) | evidence_gathering | Analyzes injury reports and player availability |
| 6 | [contrarian-evidence-searcher](./06-contrarian-evidence-searcher.md) | evidence_gathering | Explicitly searches for disconfirming evidence |
| 7 | [bayesian-updater](./07-bayesian-updater.md) | bayesian_update | Applies Bayesian reasoning to update probability |
| 8 | [devils-advocate](./08-devils-advocate.md) | premortem | Challenges the forecast and identifies weaknesses |
| 9 | [bias-detector](./09-bias-detector.md) | premortem | Identifies cognitive biases in the analysis |
| 10 | [synthesis-coordinator](./10-synthesis-coordinator.md) | synthesis | Integrates all inputs into final probability estimate |

## Stage Execution

- **Sequential Stages**: reference_class, base_rate, fermi_decomposition, bayesian_update, synthesis
- **Parallel Stages**: evidence_gathering (3 agents), premortem (2 agents)

## Source Code

Agent configurations are defined in:
- `backend/src/config/agents.config.ts`

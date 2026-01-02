# Multi-Agent Superforecaster Architecture

## Agentic System Design for College Football Prediction

---

## 1. Executive Summary

This document defines a **multi-agent architecture** for the college football prediction app that:

1. **Integrates superforecaster methodology** — Agents attached to each forecasting stage (base rates, Bayesian updates, calibration)
2. **Implements A2A-inspired protocol** — Based on Google's Agent2Agent protocol with CTC (Communication Through Coherence) enhancements
3. **Enables user customization** — UI for creating, configuring, and attaching agents to workflow stages
4. **Ensures consistency** — Standardized data formats, prompt templates, and output schemas

The architecture treats forecasting as a **pipeline of cognitive stages**, where specialized agents can augment human judgment at each step.

---

## 2. Superforecaster Methodology: The Seven Stages

### 2.1 The Forecasting Pipeline

Based on superforecaster methodology, predictions flow through distinct cognitive stages:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SUPERFORECASTER PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1          STAGE 2          STAGE 3          STAGE 4                │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ REFERENCE│     │   BASE   │     │ EVIDENCE │     │ BAYESIAN │           │
│  │  CLASS   │────▶│   RATE   │────▶│ GATHERING│────▶│  UPDATE  │           │
│  │SELECTION │     │ ANCHORING│     │          │     │          │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│       │                │                │                │                  │
│       ▼                ▼                ▼                ▼                  │
│  "What similar    "What's the     "What new      "How does this            │
│   situations      historical      information     change my                 │
│   can I           probability?"   is available?"  estimate?"                │
│   reference?"                                                               │
│                                                                             │
│  STAGE 5          STAGE 6          STAGE 7                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                            │
│  │ PREMORTEM│     │ SYNTHESIS│     │CALIBRATION│                           │
│  │  & BIAS  │────▶│ & FINAL  │────▶│ & LOGGING │                           │
│  │  CHECK   │     │ ESTIMATE │     │           │                           │
│  └──────────┘     └──────────┘     └──────────┘                            │
│       │                │                │                                   │
│       ▼                ▼                ▼                                   │
│  "What could      "Aggregate all   "Record for                             │
│   make me          perspectives     performance                             │
│   wrong?"          into final       tracking"                               │
│                    probability"                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Stage Definitions

| Stage | Name | Purpose | Agent Role |
|-------|------|---------|------------|
| **1** | Reference Class Selection | Identify similar historical situations | Search for comparable matchups, retrieve statistics |
| **2** | Base Rate Anchoring | Establish starting probability | Calculate historical win rates for reference class |
| **3** | Evidence Gathering | Collect current information | Web search, news analysis, injury reports, weather |
| **4** | Bayesian Update | Adjust probability with evidence | Apply likelihood ratios to update prior |
| **5** | Premortem & Bias Check | Challenge assumptions | Devil's advocate, identify cognitive biases |
| **6** | Synthesis | Combine all inputs into final estimate | Weighted aggregation of multiple perspectives |
| **7** | Calibration & Logging | Track accuracy over time | Record prediction, compare to outcome, compute Brier score |

### 2.3 Why Agents at Each Stage?

Each stage benefits from different agent capabilities:

```python
STAGE_AGENT_CAPABILITIES = {
    "reference_class": [
        "database_query",      # Search historical game data
        "semantic_search",     # Find similar matchups
        "categorization"       # Classify game type
    ],
    "base_rate": [
        "statistical_analysis", # Compute probabilities
        "data_aggregation",     # Combine multiple sources
        "confidence_intervals"  # Quantify uncertainty
    ],
    "evidence_gathering": [
        "web_search",           # Find news, injury reports
        "sentiment_analysis",   # Social media trends
        "real_time_data",       # Live odds movement
        "weather_api"           # Game conditions
    ],
    "bayesian_update": [
        "likelihood_estimation", # Assess evidence strength
        "probability_math",      # Apply Bayes' theorem
        "uncertainty_propagation"
    ],
    "premortem": [
        "adversarial_reasoning", # Devil's advocate
        "bias_detection",        # Identify cognitive traps
        "scenario_generation"    # "What if" analysis
    ],
    "synthesis": [
        "multi_perspective_integration",
        "confidence_weighting",
        "final_probability_estimation"
    ],
    "calibration": [
        "performance_tracking",
        "brier_score_computation",
        "feedback_generation"
    ]
}
```

---

## 3. Multi-Agent Protocol Design

### 3.1 Protocol Foundation: A2A + CTC Hybrid

Our protocol combines:

- **Google A2A Protocol**: Agent cards, task lifecycle, JSON-RPC communication
- **CTC Principles**: Phase-gated processing, coherence-weighted routing, entrainment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROTOCOL ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      A2A LAYER (Discovery & Transport)               │   │
│  │  • Agent Cards (capability advertisement)                           │   │
│  │  • Task Lifecycle (submitted → working → completed)                 │   │
│  │  • JSON-RPC 2.0 over HTTP/WebSocket                                 │   │
│  │  • Authentication (API keys, OAuth)                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CTC LAYER (Coordination & Selection)            │   │
│  │  • Phase-Gated Processing (RECEPTIVE → PROCESSING → EMITTING)       │   │
│  │  • Coherence-Weighted Routing (semantic similarity scoring)         │   │
│  │  • Entrainment (agents synchronize through interaction)             │   │
│  │  • Hierarchical Nesting (theta-gamma for coordinator-worker)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      APPLICATION LAYER (Forecasting)                 │   │
│  │  • Stage-Specific Agents (one or more per forecasting stage)        │   │
│  │  • User-Defined Custom Agents                                       │   │
│  │  • Prompt Templates & Output Schemas                                │   │
│  │  • Context Propagation                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent Card Specification

Every agent in the system has an **Agent Card** (inspired by A2A) that advertises its capabilities:

```json
{
  "agent_card": {
    "id": "evidence-gatherer-web-search",
    "name": "Web Search Evidence Agent",
    "version": "1.0.0",
    "description": "Searches the web for relevant news, injury reports, and analysis for college football games",

    "capabilities": {
      "supported_stages": ["evidence_gathering"],
      "actions": ["web_search", "summarize", "extract_entities"],
      "input_types": ["game_context", "search_query"],
      "output_types": ["evidence_list", "summary"]
    },

    "endpoint": {
      "url": "https://api.forecaster.app/agents/evidence-web-search",
      "protocol": "json-rpc-2.0",
      "auth": {
        "type": "bearer",
        "required": true
      }
    },

    "coherence_profile": {
      "semantic_domain": "sports_betting_evidence",
      "embedding_model": "text-embedding-3-small",
      "preferred_phases": ["RECEPTIVE"],
      "frequency_tier": "gamma"
    },

    "constraints": {
      "max_tokens_input": 4000,
      "max_tokens_output": 2000,
      "timeout_ms": 30000,
      "rate_limit": "10/minute"
    },

    "pricing": {
      "per_invocation": 0.01,
      "per_token_input": 0.00001,
      "per_token_output": 0.00003
    }
  }
}
```

### 3.3 Task Lifecycle

Tasks flow through a defined lifecycle (from A2A), with CTC phase-gating:

```
                              TASK LIFECYCLE
    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
    │  │SUBMITTED │───▶│ QUEUED   │───▶│ WORKING  │───▶│COMPLETED │  │
    │  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
    │       │               │               │               │         │
    │       │               │               │               │         │
    │       ▼               ▼               ▼               ▼         │
    │  Task created   Agent in        Agent in         Output        │
    │  with context   RECEPTIVE      PROCESSING       emitted        │
    │                 phase          phase            in EMITTING    │
    │                                                 phase          │
    │                                                                 │
    │                     ALTERNATIVE PATHS                           │
    │                                                                 │
    │       ┌──────────────┐         ┌──────────────┐                │
    │       │INPUT_REQUIRED│         │    FAILED    │                │
    │       └──────────────┘         └──────────────┘                │
    │       Agent needs more         Error, timeout,                 │
    │       context from user        or rejection                    │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### 3.4 CTC Phase-Gated Communication

From CTC principles, agents operate in phases:

```python
from enum import Enum
from dataclasses import dataclass
from typing import Optional, List, Any
import numpy as np

class AgentPhase(Enum):
    RECEPTIVE = "receptive"      # Can accept input (12.5% of cycle)
    PROCESSING = "processing"    # Computing (62.5% of cycle)
    EMITTING = "emitting"        # Can emit output (25% of cycle)

@dataclass
class PhaseGatedAgent:
    """
    Agent with CTC-inspired phase-gated communication.

    Agents cycle through phases, ensuring:
    - Input only accepted during RECEPTIVE phase
    - Processing protected from interruption
    - Output batched during EMITTING phase
    """

    agent_id: str
    theta: float = 0.0  # Phase ∈ [0, 2π]
    omega: float = 1.0  # Oscillation frequency
    input_buffer: List[Any] = None
    output_buffer: Optional[Any] = None

    def __post_init__(self):
        self.input_buffer = []

    @property
    def phase(self) -> AgentPhase:
        """Current phase determined by theta."""
        if self.theta < np.pi / 4:
            return AgentPhase.RECEPTIVE
        elif self.theta < 3 * np.pi / 2:
            return AgentPhase.PROCESSING
        else:
            return AgentPhase.EMITTING

    def try_receive(self, message: dict) -> bool:
        """Accept input only during RECEPTIVE phase."""
        if self.phase == AgentPhase.RECEPTIVE:
            self.input_buffer.append(message)
            return True
        return False  # Caller should retry or queue

    def try_emit(self) -> Optional[Any]:
        """Emit output only during EMITTING phase."""
        if self.phase == AgentPhase.EMITTING and self.output_buffer:
            output = self.output_buffer
            self.output_buffer = None
            return output
        return None

    def tick(self, dt: float = 0.1):
        """Advance phase by one time step."""
        self.theta = (self.theta + self.omega * dt) % (2 * np.pi)

        # Trigger processing at phase transition
        if self.phase == AgentPhase.PROCESSING and self.input_buffer:
            self._process()

    def _process(self):
        """Override in subclass for actual processing logic."""
        pass
```

### 3.5 Coherence-Weighted Routing

From CTC, use coherence (semantic similarity) to route tasks to appropriate agents:

```python
from typing import List, Tuple, Dict
import numpy as np

class CoherenceRouter:
    """
    Routes tasks to agents based on semantic coherence.

    No central routing table—coherent agents naturally selected.
    """

    def __init__(self, agents: List['AgentCard'], embedding_fn):
        self.agents = agents
        self.embed = embedding_fn
        self.coherence_threshold = 0.6

    def compute_coherence(self, task_embedding: np.ndarray,
                          agent_embedding: np.ndarray) -> float:
        """Cosine similarity as coherence measure."""
        return np.dot(task_embedding, agent_embedding) / (
            np.linalg.norm(task_embedding) * np.linalg.norm(agent_embedding) + 1e-10
        )

    def route(self, task: dict, target_stage: str) -> List[Tuple['AgentCard', float]]:
        """
        Route task to agents for a given stage.
        Returns list of (agent, coherence_score) sorted by coherence.
        """
        # Embed the task
        task_text = f"{task['game_context']} {task.get('query', '')}"
        task_embedding = self.embed(task_text)

        # Filter agents by stage capability
        stage_agents = [
            a for a in self.agents
            if target_stage in a.capabilities.get('supported_stages', [])
        ]

        # Score by coherence
        scored = []
        for agent in stage_agents:
            agent_embedding = self.embed(agent.description)
            coherence = self.compute_coherence(task_embedding, agent_embedding)

            if coherence > self.coherence_threshold:
                scored.append((agent, coherence))

        # Sort by coherence (highest first)
        scored.sort(key=lambda x: x[1], reverse=True)

        return scored

    def aggregate_outputs(self, outputs: List[Tuple[Any, float]],
                          temperature: float = 1.0) -> dict:
        """
        Aggregate multiple agent outputs weighted by coherence.

        From CTC: Coherent signals amplify, incoherent attenuate.
        """
        if not outputs:
            return None

        coherences = np.array([c for _, c in outputs])
        weights = self._softmax(coherences / temperature)

        # For structured outputs, use weighted voting or merging
        aggregated = self._weighted_merge([o for o, _ in outputs], weights)

        return {
            "aggregated_output": aggregated,
            "weights": weights.tolist(),
            "n_agents": len(outputs),
            "effective_n": 1 / np.sum(weights ** 2)  # Participation ratio
        }

    def _softmax(self, x: np.ndarray) -> np.ndarray:
        exp_x = np.exp(x - np.max(x))
        return exp_x / np.sum(exp_x)

    def _weighted_merge(self, outputs: List[dict], weights: np.ndarray) -> dict:
        """Merge outputs weighted by coherence scores."""
        # Implementation depends on output structure
        # For evidence lists: concatenate and re-rank
        # For probabilities: weighted average
        # For text: best by weight or LLM synthesis
        pass
```

---

## 4. Agent Attachment to Forecasting Stages

### 4.1 Stage-Agent Mapping

Each forecasting stage can have **zero or more agents** attached:

```python
@dataclass
class ForecastingPipeline:
    """
    Complete forecasting pipeline with agents attached to each stage.
    """

    stages: Dict[str, 'ForecastingStage']

    def __post_init__(self):
        # Initialize default stages
        self.stages = {
            "reference_class": ForecastingStage(
                name="Reference Class Selection",
                order=1,
                required=True,
                agents=[],
                input_schema=ReferenceClassInput,
                output_schema=ReferenceClassOutput
            ),
            "base_rate": ForecastingStage(
                name="Base Rate Anchoring",
                order=2,
                required=True,
                agents=[],
                input_schema=BaseRateInput,
                output_schema=BaseRateOutput
            ),
            "evidence_gathering": ForecastingStage(
                name="Evidence Gathering",
                order=3,
                required=True,
                agents=[],
                input_schema=EvidenceInput,
                output_schema=EvidenceOutput
            ),
            "bayesian_update": ForecastingStage(
                name="Bayesian Update",
                order=4,
                required=True,
                agents=[],
                input_schema=BayesianUpdateInput,
                output_schema=BayesianUpdateOutput
            ),
            "premortem": ForecastingStage(
                name="Premortem & Bias Check",
                order=5,
                required=False,
                agents=[],
                input_schema=PremortemInput,
                output_schema=PremortemOutput
            ),
            "synthesis": ForecastingStage(
                name="Synthesis",
                order=6,
                required=True,
                agents=[],
                input_schema=SynthesisInput,
                output_schema=SynthesisOutput
            ),
            "calibration": ForecastingStage(
                name="Calibration & Logging",
                order=7,
                required=True,
                agents=[],
                input_schema=CalibrationInput,
                output_schema=CalibrationOutput
            )
        }

@dataclass
class ForecastingStage:
    """Single stage in the forecasting pipeline."""

    name: str
    order: int
    required: bool
    agents: List['AttachedAgent']
    input_schema: type
    output_schema: type

    # CTC properties
    theta_coordinator: bool = False  # Is this a coordinating stage?
    gamma_workers: int = 0           # Number of parallel worker agents
```

### 4.2 Agent Attachment Configuration

Users can attach agents to stages via configuration:

```json
{
  "pipeline_config": {
    "game_id": "georgia_vs_alabama_2026",

    "stages": {
      "reference_class": {
        "enabled": true,
        "agents": [
          {
            "agent_id": "historical-matchup-finder",
            "weight": 1.0,
            "config": {
              "min_similarity": 0.7,
              "max_results": 10
            }
          }
        ]
      },

      "evidence_gathering": {
        "enabled": true,
        "parallel_execution": true,
        "agents": [
          {
            "agent_id": "web-search-news",
            "weight": 0.8,
            "config": {
              "sources": ["espn", "247sports", "rivals"],
              "max_articles": 5
            }
          },
          {
            "agent_id": "injury-report-analyzer",
            "weight": 1.0,
            "config": {
              "include_depth_chart": true
            }
          },
          {
            "agent_id": "weather-conditions",
            "weight": 0.5,
            "config": {
              "forecast_hours": 6
            }
          },
          {
            "agent_id": "social-sentiment",
            "weight": 0.3,
            "config": {
              "platforms": ["twitter", "reddit"],
              "lookback_hours": 24
            }
          }
        ]
      },

      "premortem": {
        "enabled": true,
        "agents": [
          {
            "agent_id": "devils-advocate",
            "weight": 1.0,
            "config": {
              "contrarian_strength": 0.8
            }
          },
          {
            "agent_id": "bias-detector",
            "weight": 1.0,
            "config": {
              "check_biases": ["recency", "availability", "confirmation", "anchoring"]
            }
          }
        ]
      }
    }
  }
}
```

---

## 5. Data Flow and Context Propagation

### 5.1 Context Object

A **Context Object** flows through all stages, accumulating information:

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime

@dataclass
class ForecastContext:
    """
    Context object that flows through the entire forecasting pipeline.

    Each stage reads from and writes to this context.
    """

    # Game identification
    game_id: str
    home_team: str
    away_team: str
    game_time: datetime

    # Current state
    current_stage: str = "reference_class"
    created_at: datetime = field(default_factory=datetime.now)

    # Stage outputs (accumulated as pipeline progresses)
    reference_classes: List[Dict] = field(default_factory=list)
    base_rate: Optional[float] = None
    base_rate_confidence: Optional[Tuple[float, float]] = None

    evidence: List[Dict] = field(default_factory=list)
    evidence_summary: Optional[str] = None

    bayesian_updates: List[Dict] = field(default_factory=list)
    posterior_probability: Optional[float] = None

    premortem_concerns: List[str] = field(default_factory=list)
    bias_flags: List[str] = field(default_factory=list)

    final_probability: Optional[float] = None
    confidence_interval: Optional[Tuple[float, float]] = None

    # Metadata
    agent_contributions: Dict[str, List[Dict]] = field(default_factory=dict)
    processing_times: Dict[str, float] = field(default_factory=dict)

    def to_agent_input(self, stage: str) -> dict:
        """
        Convert context to input format for a specific stage.

        Each stage gets relevant prior context.
        """
        base = {
            "game_id": self.game_id,
            "home_team": self.home_team,
            "away_team": self.away_team,
            "game_time": self.game_time.isoformat()
        }

        if stage == "reference_class":
            return base

        if stage == "base_rate":
            return {
                **base,
                "reference_classes": self.reference_classes
            }

        if stage == "evidence_gathering":
            return {
                **base,
                "reference_classes": self.reference_classes,
                "base_rate": self.base_rate
            }

        if stage == "bayesian_update":
            return {
                **base,
                "base_rate": self.base_rate,
                "evidence": self.evidence
            }

        if stage == "premortem":
            return {
                **base,
                "base_rate": self.base_rate,
                "evidence": self.evidence,
                "current_posterior": self.posterior_probability
            }

        if stage == "synthesis":
            return {
                **base,
                "base_rate": self.base_rate,
                "evidence": self.evidence,
                "bayesian_updates": self.bayesian_updates,
                "posterior_probability": self.posterior_probability,
                "premortem_concerns": self.premortem_concerns,
                "bias_flags": self.bias_flags
            }

        if stage == "calibration":
            return {
                **base,
                "final_probability": self.final_probability,
                "confidence_interval": self.confidence_interval
            }

        return base

    def update_from_agent(self, stage: str, agent_id: str, output: dict):
        """Update context with agent output."""

        # Track contribution
        if stage not in self.agent_contributions:
            self.agent_contributions[stage] = []
        self.agent_contributions[stage].append({
            "agent_id": agent_id,
            "output": output,
            "timestamp": datetime.now().isoformat()
        })

        # Stage-specific updates
        if stage == "reference_class":
            self.reference_classes.extend(output.get("matches", []))

        elif stage == "base_rate":
            if output.get("probability"):
                self.base_rate = output["probability"]
                self.base_rate_confidence = output.get("confidence_interval")

        elif stage == "evidence_gathering":
            self.evidence.extend(output.get("evidence_items", []))

        elif stage == "bayesian_update":
            self.bayesian_updates.extend(output.get("updates", []))
            if output.get("posterior"):
                self.posterior_probability = output["posterior"]

        elif stage == "premortem":
            self.premortem_concerns.extend(output.get("concerns", []))
            self.bias_flags.extend(output.get("biases", []))

        elif stage == "synthesis":
            if output.get("final_probability"):
                self.final_probability = output["final_probability"]
                self.confidence_interval = output.get("confidence_interval")
```

### 5.2 Data Schema Per Stage

Each stage has defined input/output schemas for consistency:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Reference Class Selection
# ─────────────────────────────────────────────────────────────────────────────

class ReferenceClassInput(BaseModel):
    """Input for reference class selection stage."""
    game_id: str
    home_team: str
    away_team: str
    home_ranking: Optional[int] = None
    away_ranking: Optional[int] = None
    conference: str
    venue: str
    is_rivalry: bool = False

class ReferenceClassMatch(BaseModel):
    """A single reference class match."""
    description: str
    historical_sample_size: int
    relevance_score: float = Field(ge=0, le=1)
    category: str  # e.g., "ranked_matchup", "rivalry", "conference_game"

class ReferenceClassOutput(BaseModel):
    """Output from reference class selection."""
    matches: List[ReferenceClassMatch]
    reasoning: str
    recommended_class: str

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Base Rate Anchoring
# ─────────────────────────────────────────────────────────────────────────────

class BaseRateInput(BaseModel):
    """Input for base rate calculation."""
    reference_classes: List[ReferenceClassMatch]
    team_for_probability: str  # Which team are we estimating win probability for?

class BaseRateOutput(BaseModel):
    """Output from base rate calculation."""
    probability: float = Field(ge=0, le=1)
    confidence_interval: Tuple[float, float]
    sample_size: int
    sources: List[str]
    reasoning: str

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3: Evidence Gathering
# ─────────────────────────────────────────────────────────────────────────────

class EvidenceInput(BaseModel):
    """Input for evidence gathering."""
    game_id: str
    home_team: str
    away_team: str
    base_rate: float
    search_queries: Optional[List[str]] = None

class EvidenceItem(BaseModel):
    """A single piece of evidence."""
    type: str  # "injury", "weather", "news", "statistical", "sentiment"
    source: str
    content: str
    relevance: float = Field(ge=0, le=1)
    direction: str  # "favors_home", "favors_away", "neutral"
    suggested_likelihood_ratio: Optional[float] = None
    timestamp: datetime

class EvidenceOutput(BaseModel):
    """Output from evidence gathering."""
    evidence_items: List[EvidenceItem]
    summary: str
    key_factors: List[str]

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4: Bayesian Update
# ─────────────────────────────────────────────────────────────────────────────

class BayesianUpdateInput(BaseModel):
    """Input for Bayesian update stage."""
    prior: float = Field(ge=0, le=1)
    evidence: List[EvidenceItem]

class BayesianUpdate(BaseModel):
    """A single Bayesian update step."""
    evidence_description: str
    likelihood_ratio: float
    prior: float
    posterior: float
    reasoning: str

class BayesianUpdateOutput(BaseModel):
    """Output from Bayesian update stage."""
    updates: List[BayesianUpdate]
    posterior: float = Field(ge=0, le=1)
    update_chain: str  # Human-readable update chain

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 5: Premortem & Bias Check
# ─────────────────────────────────────────────────────────────────────────────

class PremortemInput(BaseModel):
    """Input for premortem analysis."""
    current_probability: float
    reasoning_so_far: str
    evidence_used: List[EvidenceItem]

class PremortemOutput(BaseModel):
    """Output from premortem analysis."""
    concerns: List[str]
    biases: List[str]
    alternative_scenarios: List[str]
    confidence_adjustment: Optional[float] = None

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 6: Synthesis
# ─────────────────────────────────────────────────────────────────────────────

class SynthesisInput(BaseModel):
    """Input for synthesis stage."""
    base_rate: float
    posterior_probability: float
    premortem_concerns: List[str]
    bias_flags: List[str]
    all_evidence: List[EvidenceItem]

class SynthesisOutput(BaseModel):
    """Output from synthesis stage."""
    final_probability: float = Field(ge=0, le=1)
    confidence_interval: Tuple[float, float]
    key_drivers: List[str]
    uncertainty_sources: List[str]
    recommendation: str  # "strong_buy", "buy", "neutral", "avoid"

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 7: Calibration
# ─────────────────────────────────────────────────────────────────────────────

class CalibrationInput(BaseModel):
    """Input for calibration stage."""
    prediction_id: str
    predicted_probability: float
    actual_outcome: Optional[bool] = None  # None if game not yet played

class CalibrationOutput(BaseModel):
    """Output from calibration stage."""
    prediction_logged: bool
    brier_score: Optional[float] = None
    calibration_bucket: str  # e.g., "60-70%"
    historical_accuracy_in_bucket: Optional[float] = None
```

---

## 6. Prompt Templates and User Customization

### 6.1 Template Structure

Each agent uses a **prompt template** that can be customized by users:

```python
@dataclass
class PromptTemplate:
    """
    Configurable prompt template for agent invocation.

    Uses Jinja2-style templating for variable substitution.
    """

    template_id: str
    stage: str
    name: str
    description: str

    # System prompt (sets agent persona/behavior)
    system_prompt: str

    # User prompt template (with {{variables}})
    user_prompt_template: str

    # Variables that will be injected
    required_variables: List[str]
    optional_variables: List[str]

    # Output format specification
    output_format: str  # "json", "markdown", "structured"
    output_schema: Optional[type] = None  # Pydantic model for validation

    # Customization options
    customizable_fields: List[str]

    def render(self, context: dict) -> Tuple[str, str]:
        """Render system and user prompts with context."""
        from jinja2 import Template

        system = Template(self.system_prompt).render(**context)
        user = Template(self.user_prompt_template).render(**context)

        return system, user
```

### 6.2 Default Templates Per Stage

```python
DEFAULT_TEMPLATES = {
    "reference_class": PromptTemplate(
        template_id="reference_class_default",
        stage="reference_class",
        name="Default Reference Class Finder",
        description="Identifies similar historical matchups for base rate anchoring",

        system_prompt="""You are an expert sports analyst specializing in college football statistics and historical analysis.

Your task is to identify REFERENCE CLASSES - categories of similar historical games that can inform probability estimates.

Focus on finding truly comparable situations. Consider:
- Team rankings and relative strength
- Conference dynamics
- Home/away factors
- Rivalry status
- Time of season
- Historical head-to-head

Be specific about sample sizes and relevance scores.""",

        user_prompt_template="""Find reference classes for this upcoming game:

**Game:** {{home_team}} vs {{away_team}}
**Venue:** {{venue}}
**Home Ranking:** {{home_ranking or 'Unranked'}}
**Away Ranking:** {{away_ranking or 'Unranked'}}
**Conference:** {{conference}}
**Is Rivalry:** {{is_rivalry}}

Identify 3-5 reference classes, ordered by relevance. For each, specify:
1. Description of the reference class
2. Historical sample size (number of similar games)
3. Relevance score (0-1)
4. Category (e.g., "ranked_matchup", "conference_championship")

Respond in JSON format matching this schema:
```json
{
  "matches": [
    {
      "description": "...",
      "historical_sample_size": N,
      "relevance_score": 0.X,
      "category": "..."
    }
  ],
  "reasoning": "...",
  "recommended_class": "..."
}
```""",

        required_variables=["home_team", "away_team", "venue", "conference"],
        optional_variables=["home_ranking", "away_ranking", "is_rivalry"],
        output_format="json",
        output_schema=ReferenceClassOutput,
        customizable_fields=["system_prompt", "user_prompt_template"]
    ),

    "evidence_gathering_web_search": PromptTemplate(
        template_id="evidence_web_search",
        stage="evidence_gathering",
        name="Web Search Evidence Gatherer",
        description="Searches web for relevant news, injury reports, and analysis",

        system_prompt="""You are a sports research analyst with access to web search capabilities.

Your task is to gather EVIDENCE that could update probability estimates for a college football game.

Focus on finding:
- Injury reports (starters, key players)
- Recent team performance and trends
- Weather conditions (if outdoor stadium)
- Coaching updates
- Insider analysis and expert predictions
- Line movement and betting market signals

For each piece of evidence, assess:
- Relevance to the game outcome
- Direction (favors home, away, or neutral)
- Suggested likelihood ratio (how much to update probability)

Be factual and cite sources.""",

        user_prompt_template="""Search for evidence relevant to this game:

**Game:** {{home_team}} vs {{away_team}}
**Game Time:** {{game_time}}
**Current Base Rate ({{team_for_probability}} win):** {{base_rate | round(2)}}

Search for and analyze:
{{#if custom_queries}}
Custom search queries:
{% for query in custom_queries %}
- {{query}}
{% endfor %}
{{else}}
1. "{{home_team}} {{away_team}} injury report"
2. "{{home_team}} {{away_team}} preview analysis"
3. "{{away_team}} recent performance"
4. "{{home_team}} recent performance"
{{/if}}

For each evidence item found, provide:
- Type (injury, weather, news, statistical, sentiment)
- Source URL/name
- Content summary
- Relevance (0-1)
- Direction (favors_home, favors_away, neutral)
- Suggested likelihood ratio (if applicable)

Respond in JSON format.""",

        required_variables=["home_team", "away_team", "game_time", "base_rate"],
        optional_variables=["custom_queries", "team_for_probability"],
        output_format="json",
        output_schema=EvidenceOutput,
        customizable_fields=["system_prompt", "user_prompt_template", "custom_queries"]
    ),

    "bayesian_update": PromptTemplate(
        template_id="bayesian_update_default",
        stage="bayesian_update",
        name="Bayesian Probability Updater",
        description="Applies Bayesian updates to prior probability based on evidence",

        system_prompt="""You are a quantitative analyst applying Bayesian reasoning to sports predictions.

Your task is to UPDATE a prior probability based on new evidence using Bayes' theorem.

For each piece of evidence:
1. Assess likelihood ratio: P(evidence | hypothesis true) / P(evidence | hypothesis false)
2. Apply the update: posterior_odds = prior_odds × likelihood_ratio
3. Convert back to probability

Guidelines for likelihood ratios:
- Key player injury: LR = 0.7-0.85 (reduces probability)
- Favorable weather: LR = 1.05-1.15 (slight increase)
- Strong recent performance: LR = 1.1-1.3
- Expert consensus against: LR = 0.8-0.9

Be calibrated. Most evidence has LR between 0.7 and 1.5.
Strong evidence (LR > 2 or < 0.5) is rare.""",

        user_prompt_template="""Update probability based on this evidence:

**Prior Probability ({{team_for_probability}} win):** {{prior | round(3)}}

**Evidence to incorporate:**
{% for item in evidence %}
{{loop.index}}. **{{item.type}}**: {{item.content}}
   - Source: {{item.source}}
   - Direction: {{item.direction}}
   {% if item.suggested_likelihood_ratio %}- Suggested LR: {{item.suggested_likelihood_ratio}}{% endif %}
{% endfor %}

For each piece of evidence:
1. Assess the likelihood ratio
2. Show the calculation
3. State the new posterior

Then provide the final posterior probability after all updates.

Respond in JSON format with an "updates" array and final "posterior".""",

        required_variables=["prior", "evidence", "team_for_probability"],
        optional_variables=[],
        output_format="json",
        output_schema=BayesianUpdateOutput,
        customizable_fields=["system_prompt"]
    ),

    "premortem": PromptTemplate(
        template_id="premortem_default",
        stage="premortem",
        name="Premortem Analyst",
        description="Challenges assumptions and identifies potential biases",

        system_prompt="""You are a critical analyst tasked with finding FLAWS in a prediction.

Your job is to:
1. Play devil's advocate - argue against the current probability estimate
2. Identify cognitive biases that may have affected the analysis
3. Generate alternative scenarios that could upset the prediction

Common biases to check:
- Recency bias: Overweighting recent games
- Availability bias: Overweighting memorable events
- Confirmation bias: Seeking evidence that confirms prior belief
- Anchoring bias: Insufficient adjustment from initial estimate
- Narrative fallacy: Creating coherent stories that overlook randomness

Be intellectually rigorous. Your job is to make the forecast BETTER by challenging it.""",

        user_prompt_template="""Challenge this prediction:

**Prediction:** {{team_for_probability}} win probability = {{current_probability | round(3)}}

**Reasoning used:**
{{reasoning_so_far}}

**Evidence considered:**
{% for item in evidence_used %}
- {{item.type}}: {{item.content}}
{% endfor %}

Please provide:
1. **Concerns**: 3-5 reasons this prediction might be wrong
2. **Biases**: Which cognitive biases might have affected this analysis?
3. **Alternative Scenarios**: 2-3 scenarios where the underdog wins
4. **Confidence Adjustment**: Should we widen the confidence interval? By how much?

Respond in JSON format.""",

        required_variables=["team_for_probability", "current_probability", "reasoning_so_far", "evidence_used"],
        optional_variables=[],
        output_format="json",
        output_schema=PremortemOutput,
        customizable_fields=["system_prompt", "user_prompt_template"]
    )
}
```

### 6.3 User Customization Interface

Users can customize agents through the UI:

```python
@dataclass
class UserAgentConfig:
    """
    User's customization of an agent for a specific stage.
    """

    user_id: str
    agent_id: str
    stage: str

    # Template customization
    custom_system_prompt: Optional[str] = None
    custom_user_prompt: Optional[str] = None

    # Agent behavior
    temperature: float = 0.7
    max_tokens: int = 2000

    # Stage-specific config
    stage_config: dict = field(default_factory=dict)

    # Weighting in multi-agent aggregation
    weight: float = 1.0

    # Enable/disable
    enabled: bool = True

class AgentCustomizationUI:
    """
    UI state and actions for agent customization.
    """

    @staticmethod
    def get_customization_schema(stage: str) -> dict:
        """Return JSON schema for stage-specific customization options."""

        schemas = {
            "reference_class": {
                "min_relevance_score": {
                    "type": "number",
                    "min": 0,
                    "max": 1,
                    "default": 0.5,
                    "description": "Minimum relevance score for reference class matches"
                },
                "max_classes": {
                    "type": "integer",
                    "min": 1,
                    "max": 10,
                    "default": 5,
                    "description": "Maximum number of reference classes to return"
                }
            },
            "evidence_gathering": {
                "sources": {
                    "type": "multiselect",
                    "options": ["espn", "247sports", "rivals", "reddit", "twitter", "weather"],
                    "default": ["espn", "247sports"],
                    "description": "Sources to search for evidence"
                },
                "max_articles": {
                    "type": "integer",
                    "min": 1,
                    "max": 20,
                    "default": 5,
                    "description": "Maximum articles per source"
                },
                "custom_queries": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Custom search queries to run"
                }
            },
            "bayesian_update": {
                "max_likelihood_ratio": {
                    "type": "number",
                    "min": 1.1,
                    "max": 5.0,
                    "default": 2.0,
                    "description": "Cap on individual evidence LR"
                },
                "min_likelihood_ratio": {
                    "type": "number",
                    "min": 0.1,
                    "max": 0.9,
                    "default": 0.5,
                    "description": "Floor on individual evidence LR"
                }
            },
            "premortem": {
                "contrarian_strength": {
                    "type": "number",
                    "min": 0,
                    "max": 1,
                    "default": 0.7,
                    "description": "How aggressively to challenge predictions"
                },
                "biases_to_check": {
                    "type": "multiselect",
                    "options": ["recency", "availability", "confirmation", "anchoring", "narrative"],
                    "default": ["recency", "confirmation", "anchoring"],
                    "description": "Cognitive biases to specifically check for"
                }
            }
        }

        return schemas.get(stage, {})
```

---

## 7. Output Format Consistency

### 7.1 Standardized Response Envelope

All agent responses use a consistent envelope:

```python
@dataclass
class AgentResponse:
    """
    Standardized response envelope for all agent outputs.
    """

    # Metadata
    agent_id: str
    task_id: str
    stage: str
    timestamp: datetime

    # Status
    status: str  # "success", "partial", "failed", "input_required"
    error: Optional[str] = None

    # Content
    output: dict  # Stage-specific output (validated against schema)
    raw_response: Optional[str] = None  # Raw LLM output for debugging

    # Quality metrics
    confidence: float = Field(ge=0, le=1, default=0.8)
    coherence_score: Optional[float] = None  # If routed via coherence

    # Token usage
    tokens_input: int = 0
    tokens_output: int = 0

    # Timing
    latency_ms: int = 0

    def validate_output(self, schema: type) -> bool:
        """Validate output against expected Pydantic schema."""
        try:
            schema(**self.output)
            return True
        except ValidationError:
            return False
```

### 7.2 UI Response Rendering

Different stages render differently in the UI:

```typescript
// Frontend: UI rendering configuration per stage

interface StageRenderConfig {
  stage: string;
  component: React.ComponentType<any>;
  displayMode: 'card' | 'table' | 'timeline' | 'chart';
  expandable: boolean;
}

const STAGE_RENDER_CONFIGS: Record<string, StageRenderConfig> = {
  reference_class: {
    stage: 'reference_class',
    component: ReferenceClassDisplay,
    displayMode: 'card',
    expandable: true
  },

  base_rate: {
    stage: 'base_rate',
    component: BaseRateGauge,
    displayMode: 'chart',
    expandable: false
  },

  evidence_gathering: {
    stage: 'evidence_gathering',
    component: EvidenceTimeline,
    displayMode: 'timeline',
    expandable: true
  },

  bayesian_update: {
    stage: 'bayesian_update',
    component: BayesianUpdateChain,
    displayMode: 'chart',
    expandable: true
  },

  premortem: {
    stage: 'premortem',
    component: PremortemWarnings,
    displayMode: 'card',
    expandable: true
  },

  synthesis: {
    stage: 'synthesis',
    component: FinalProbabilityDisplay,
    displayMode: 'chart',
    expandable: false
  }
};

// Example component for Bayesian Update visualization
const BayesianUpdateChain: React.FC<{ updates: BayesianUpdate[] }> = ({ updates }) => {
  return (
    <div className="bayesian-chain">
      {updates.map((update, i) => (
        <div key={i} className="update-step">
          <div className="prior">{(update.prior * 100).toFixed(1)}%</div>
          <div className="arrow">
            <span className="lr">LR: {update.likelihood_ratio.toFixed(2)}</span>
            →
          </div>
          <div className="posterior">{(update.posterior * 100).toFixed(1)}%</div>
          <div className="evidence">{update.evidence_description}</div>
        </div>
      ))}
    </div>
  );
};
```

---

## 8. Multi-Agent Coordination Patterns

### 8.1 Pattern 1: Parallel Evidence Gathering (Gamma Workers)

Multiple agents gather evidence simultaneously, then aggregate:

```python
class ParallelEvidenceGathering:
    """
    Theta-Gamma pattern: Coordinator dispatches to parallel workers.

    Based on CTC Principle 6: Cross-Frequency Coupling
    """

    def __init__(self, evidence_agents: List[AttachedAgent]):
        self.workers = evidence_agents  # Gamma workers
        self.aggregator = CoherenceAggregator(temperature=0.8)

    async def gather(self, context: ForecastContext) -> EvidenceOutput:
        """
        Run all evidence agents in parallel, then aggregate.
        """
        # Dispatch to all workers (gamma phase)
        tasks = []
        for agent in self.workers:
            task = self._invoke_agent(agent, context)
            tasks.append(task)

        # Await all completions
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter successful results
        successful = [
            (r, agent.weight)
            for r, agent in zip(results, self.workers)
            if not isinstance(r, Exception) and r.status == "success"
        ]

        # Aggregate (theta phase - integration)
        aggregated = self._aggregate_evidence(successful)

        return aggregated

    def _aggregate_evidence(self, results: List[Tuple[AgentResponse, float]]) -> EvidenceOutput:
        """
        Combine evidence from multiple agents.
        - Deduplicate similar evidence items
        - Weight by agent weight and coherence
        - Rank by relevance
        """
        all_evidence = []

        for response, weight in results:
            for item in response.output.get("evidence_items", []):
                item["source_agent"] = response.agent_id
                item["weight"] = weight * item.get("relevance", 1.0)
                all_evidence.append(item)

        # Deduplicate by semantic similarity
        deduped = self._deduplicate(all_evidence)

        # Sort by weighted relevance
        deduped.sort(key=lambda x: x["weight"], reverse=True)

        return EvidenceOutput(
            evidence_items=deduped[:20],  # Top 20
            summary=self._generate_summary(deduped),
            key_factors=self._extract_key_factors(deduped)
        )
```

### 8.2 Pattern 2: Adversarial Debate (Premortem)

Two agents debate the prediction:

```python
class AdversarialDebate:
    """
    Two agents debate: one supports, one challenges.

    Based on CTC Principle 3: Emergent Selectivity
    (Better arguments win through coherence, not authority)
    """

    def __init__(self, supporter_agent: AttachedAgent,
                 challenger_agent: AttachedAgent):
        self.supporter = supporter_agent
        self.challenger = challenger_agent
        self.rounds = 2

    async def debate(self, context: ForecastContext) -> PremortemOutput:
        """
        Run adversarial debate for N rounds.
        """
        debate_history = []

        for round_num in range(self.rounds):
            # Supporter argues for the prediction
            support_args = await self._invoke_agent(
                self.supporter,
                context,
                role="support",
                prior_debate=debate_history
            )
            debate_history.append(("support", support_args))

            # Challenger argues against
            challenge_args = await self._invoke_agent(
                self.challenger,
                context,
                role="challenge",
                prior_debate=debate_history
            )
            debate_history.append(("challenge", challenge_args))

        # Synthesize debate into concerns and biases
        return self._synthesize_debate(debate_history)

    def _synthesize_debate(self, history: List) -> PremortemOutput:
        """Extract key concerns and biases from debate."""
        concerns = []
        biases = []

        for role, args in history:
            if role == "challenge":
                concerns.extend(args.get("concerns", []))
                biases.extend(args.get("biases_identified", []))

        return PremortemOutput(
            concerns=list(set(concerns)),
            biases=list(set(biases)),
            alternative_scenarios=self._extract_scenarios(history),
            confidence_adjustment=self._compute_adjustment(history)
        )
```

### 8.3 Pattern 3: Hierarchical Synthesis (Theta Coordinator)

Coordinator agent synthesizes outputs from all prior stages:

```python
class HierarchicalSynthesis:
    """
    Theta-level coordinator that synthesizes all stage outputs.

    Based on CTC Principle 7: Hierarchical Nesting
    """

    def __init__(self, synthesis_agent: AttachedAgent):
        self.coordinator = synthesis_agent

    async def synthesize(self, context: ForecastContext) -> SynthesisOutput:
        """
        Synthesize all prior stage outputs into final probability.
        """
        # Prepare comprehensive input
        synthesis_input = SynthesisInput(
            base_rate=context.base_rate,
            posterior_probability=context.posterior_probability,
            premortem_concerns=context.premortem_concerns,
            bias_flags=context.bias_flags,
            all_evidence=context.evidence
        )

        # Include all agent contributions for transparency
        synthesis_input_extended = {
            **synthesis_input.dict(),
            "agent_contributions": context.agent_contributions,
            "processing_summary": self._summarize_processing(context)
        }

        # Invoke synthesis agent
        response = await self._invoke_agent(
            self.coordinator,
            synthesis_input_extended
        )

        return SynthesisOutput(**response.output)

    def _summarize_processing(self, context: ForecastContext) -> str:
        """Generate human-readable summary of all processing."""
        summary = []

        summary.append(f"Reference Classes: {len(context.reference_classes)} identified")
        summary.append(f"Base Rate: {context.base_rate:.1%}")
        summary.append(f"Evidence Items: {len(context.evidence)} gathered")
        summary.append(f"Bayesian Updates: {len(context.bayesian_updates)} applied")
        summary.append(f"Posterior: {context.posterior_probability:.1%}")
        summary.append(f"Concerns Raised: {len(context.premortem_concerns)}")
        summary.append(f"Biases Flagged: {len(context.bias_flags)}")

        return "\n".join(summary)
```

---

## 9. Agent Registry and Discovery

### 9.1 Agent Registry

Central registry for all available agents:

```python
class AgentRegistry:
    """
    Registry of all available agents.

    Based on A2A: Agent Cards for capability discovery.
    """

    def __init__(self):
        self.agents: Dict[str, AgentCard] = {}
        self.by_stage: Dict[str, List[str]] = defaultdict(list)

    def register(self, agent_card: AgentCard):
        """Register an agent."""
        self.agents[agent_card.id] = agent_card

        for stage in agent_card.capabilities.get("supported_stages", []):
            self.by_stage[stage].append(agent_card.id)

    def get_agents_for_stage(self, stage: str) -> List[AgentCard]:
        """Get all agents that support a stage."""
        return [
            self.agents[aid]
            for aid in self.by_stage.get(stage, [])
        ]

    def discover(self, query: str, stage: Optional[str] = None) -> List[AgentCard]:
        """
        Discover agents matching a query.

        Uses semantic search over agent descriptions.
        """
        candidates = self.agents.values()

        if stage:
            candidates = self.get_agents_for_stage(stage)

        # Score by semantic similarity to query
        scored = []
        query_embedding = self.embed(query)

        for agent in candidates:
            agent_embedding = self.embed(agent.description)
            score = cosine_similarity(query_embedding, agent_embedding)
            scored.append((agent, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [a for a, s in scored if s > 0.5]

# Default agents to register
DEFAULT_AGENTS = [
    AgentCard(
        id="reference-class-historical",
        name="Historical Matchup Finder",
        description="Searches historical college football games to find similar matchups for base rate calculation",
        capabilities={
            "supported_stages": ["reference_class"],
            "actions": ["database_query", "semantic_search"],
            "input_types": ["game_context"],
            "output_types": ["reference_class_list"]
        },
        coherence_profile={
            "semantic_domain": "sports_history",
            "frequency_tier": "gamma"
        }
    ),

    AgentCard(
        id="evidence-web-search",
        name="Web Search Evidence Gatherer",
        description="Searches the web for news, injury reports, and analysis relevant to the game",
        capabilities={
            "supported_stages": ["evidence_gathering"],
            "actions": ["web_search", "summarize"],
            "input_types": ["game_context", "search_query"],
            "output_types": ["evidence_list"]
        },
        coherence_profile={
            "semantic_domain": "sports_news",
            "frequency_tier": "gamma"
        }
    ),

    AgentCard(
        id="evidence-injury-analyzer",
        name="Injury Report Analyzer",
        description="Analyzes injury reports and depth charts to assess team health",
        capabilities={
            "supported_stages": ["evidence_gathering"],
            "actions": ["data_extraction", "impact_assessment"],
            "input_types": ["team_names"],
            "output_types": ["injury_report"]
        },
        coherence_profile={
            "semantic_domain": "sports_injuries",
            "frequency_tier": "gamma"
        }
    ),

    AgentCard(
        id="bayesian-updater",
        name="Bayesian Probability Updater",
        description="Applies Bayesian inference to update probability estimates based on evidence",
        capabilities={
            "supported_stages": ["bayesian_update"],
            "actions": ["likelihood_estimation", "probability_update"],
            "input_types": ["prior", "evidence_list"],
            "output_types": ["posterior", "update_chain"]
        },
        coherence_profile={
            "semantic_domain": "probability_reasoning",
            "frequency_tier": "gamma"
        }
    ),

    AgentCard(
        id="devils-advocate",
        name="Devil's Advocate",
        description="Challenges predictions by arguing the opposing case and identifying weaknesses",
        capabilities={
            "supported_stages": ["premortem"],
            "actions": ["adversarial_reasoning", "weakness_identification"],
            "input_types": ["prediction", "reasoning"],
            "output_types": ["concerns", "alternative_scenarios"]
        },
        coherence_profile={
            "semantic_domain": "critical_analysis",
            "frequency_tier": "gamma"
        }
    ),

    AgentCard(
        id="bias-detector",
        name="Cognitive Bias Detector",
        description="Identifies cognitive biases that may have affected the analysis",
        capabilities={
            "supported_stages": ["premortem"],
            "actions": ["bias_detection", "debiasing_suggestions"],
            "input_types": ["reasoning_chain"],
            "output_types": ["bias_flags", "corrections"]
        },
        coherence_profile={
            "semantic_domain": "cognitive_psychology",
            "frequency_tier": "gamma"
        }
    ),

    AgentCard(
        id="synthesis-coordinator",
        name="Synthesis Coordinator",
        description="Integrates all stage outputs into a final probability estimate with confidence intervals",
        capabilities={
            "supported_stages": ["synthesis"],
            "actions": ["multi_perspective_integration", "final_estimation"],
            "input_types": ["all_stage_outputs"],
            "output_types": ["final_probability", "confidence_interval"]
        },
        coherence_profile={
            "semantic_domain": "forecasting_synthesis",
            "frequency_tier": "theta"  # Coordinator role
        }
    )
]
```

---

## 10. UI Components for Agent Management

### 10.1 Agent Configuration Panel

```typescript
// React component for agent configuration

interface AgentConfigPanelProps {
  stage: string;
  availableAgents: AgentCard[];
  attachedAgents: UserAgentConfig[];
  onAttach: (agentId: string, config: Partial<UserAgentConfig>) => void;
  onDetach: (agentId: string) => void;
  onUpdate: (agentId: string, config: Partial<UserAgentConfig>) => void;
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  stage,
  availableAgents,
  attachedAgents,
  onAttach,
  onDetach,
  onUpdate
}) => {
  return (
    <div className="agent-config-panel">
      <h3>{getStageName(stage)} - Agent Configuration</h3>

      {/* Attached Agents */}
      <div className="attached-agents">
        <h4>Active Agents</h4>
        {attachedAgents.map(config => (
          <AgentCard
            key={config.agent_id}
            agent={availableAgents.find(a => a.id === config.agent_id)}
            config={config}
            onUpdate={(c) => onUpdate(config.agent_id, c)}
            onDetach={() => onDetach(config.agent_id)}
          />
        ))}
      </div>

      {/* Available Agents */}
      <div className="available-agents">
        <h4>Available Agents</h4>
        {availableAgents
          .filter(a => !attachedAgents.find(c => c.agent_id === a.id))
          .map(agent => (
            <AgentPreview
              key={agent.id}
              agent={agent}
              onAttach={() => onAttach(agent.id, { weight: 1.0, enabled: true })}
            />
          ))}
      </div>
    </div>
  );
};

// Individual agent card with configuration
const AgentCard: React.FC<{
  agent: AgentCard;
  config: UserAgentConfig;
  onUpdate: (config: Partial<UserAgentConfig>) => void;
  onDetach: () => void;
}> = ({ agent, config, onUpdate, onDetach }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className={`agent-card ${config.enabled ? 'enabled' : 'disabled'}`}>
      <div className="agent-header">
        <span className="agent-name">{agent.name}</span>
        <Toggle
          checked={config.enabled}
          onChange={(enabled) => onUpdate({ enabled })}
        />
      </div>

      <p className="agent-description">{agent.description}</p>

      <div className="agent-controls">
        <Slider
          label="Weight"
          min={0}
          max={2}
          step={0.1}
          value={config.weight}
          onChange={(weight) => onUpdate({ weight })}
        />

        <Button
          variant="text"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Button>

        <Button
          variant="danger"
          onClick={onDetach}
        >
          Remove
        </Button>
      </div>

      {showAdvanced && (
        <div className="advanced-config">
          <TextArea
            label="Custom System Prompt (optional)"
            value={config.custom_system_prompt || ''}
            onChange={(v) => onUpdate({ custom_system_prompt: v || null })}
            placeholder={agent.default_system_prompt}
          />

          <NumberInput
            label="Temperature"
            min={0}
            max={2}
            step={0.1}
            value={config.temperature}
            onChange={(temperature) => onUpdate({ temperature })}
          />

          <StageConfigEditor
            stage={config.stage}
            config={config.stage_config}
            onChange={(stage_config) => onUpdate({ stage_config })}
          />
        </div>
      )}
    </div>
  );
};
```

### 10.2 Pipeline Visualization

```typescript
// Visual representation of the forecasting pipeline with agents

const PipelineVisualization: React.FC<{
  pipeline: ForecastingPipeline;
  currentStage: string;
  context: ForecastContext;
}> = ({ pipeline, currentStage, context }) => {
  return (
    <div className="pipeline-viz">
      {Object.entries(pipeline.stages).map(([stageId, stage]) => (
        <div
          key={stageId}
          className={`stage-node ${stageId === currentStage ? 'active' : ''} ${
            context.processing_times[stageId] ? 'completed' : 'pending'
          }`}
        >
          <div className="stage-header">
            <span className="stage-number">{stage.order}</span>
            <span className="stage-name">{stage.name}</span>
          </div>

          <div className="stage-agents">
            {stage.agents.map(agent => (
              <div
                key={agent.agent_id}
                className="agent-chip"
                title={agent.agent_id}
              >
                {agent.enabled ? '✓' : '○'} {getAgentName(agent.agent_id)}
              </div>
            ))}
          </div>

          {context.agent_contributions[stageId] && (
            <div className="stage-output-preview">
              <OutputPreview
                stage={stageId}
                contributions={context.agent_contributions[stageId]}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 11. Implementation Architecture

### 11.1 Backend Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  API Gateway    │  │  Agent Registry │  │  Task Queue     │             │
│  │  (FastAPI)      │  │  Service        │  │  (Redis/Celery) │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                     Pipeline Orchestrator                    │           │
│  │  - Manages forecasting workflow                              │           │
│  │  - Routes tasks to agents                                    │           │
│  │  - Aggregates outputs                                        │           │
│  │  - Maintains context                                         │           │
│  └─────────────────────────────────────────────────────────────┘           │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  LLM Gateway    │  │  Tool Service   │  │  Data Service   │             │
│  │  (OpenAI/       │  │  (Web Search,   │  │  (ESPN, Odds    │             │
│  │   Anthropic)    │  │   Weather, etc) │  │   API, History) │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REQUEST FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User initiates forecast                                                 │
│     └──▶ UI sends game context + pipeline config                            │
│                                                                             │
│  2. API Gateway receives request                                            │
│     └──▶ Creates ForecastContext                                            │
│     └──▶ Queues pipeline execution                                          │
│                                                                             │
│  3. Pipeline Orchestrator runs stages sequentially                          │
│     ┌──────────────────────────────────────────────────────────────┐       │
│     │ For each stage:                                               │       │
│     │   a. Get attached agents from config                          │       │
│     │   b. Prepare stage input from context                         │       │
│     │   c. Invoke agents (parallel if configured)                   │       │
│     │   d. Aggregate outputs                                        │       │
│     │   e. Update context                                           │       │
│     │   f. Emit progress via WebSocket                              │       │
│     └──────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  4. Stage execution                                                         │
│     ┌──────────────────────────────────────────────────────────────┐       │
│     │ For each agent:                                               │       │
│     │   a. Render prompt template with context                      │       │
│     │   b. Call LLM Gateway                                         │       │
│     │   c. Parse and validate output                                │       │
│     │   d. Return AgentResponse                                     │       │
│     └──────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  5. Completion                                                              │
│     └──▶ Final ForecastContext returned to UI                              │
│     └──▶ Prediction logged for calibration                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Summary: Key Design Decisions

### 12.1 Protocol Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Communication** | JSON-RPC 2.0 over HTTP/WebSocket | A2A standard, language-agnostic |
| **Discovery** | Agent Cards | A2A standard, capability advertisement |
| **Routing** | Coherence-weighted | CTC principle, no central router |
| **Coordination** | Phase-gated (CTC) | Prevents race conditions, natural batching |
| **Hierarchy** | Theta-Gamma | CTC principle, coordinator-worker pattern |

### 12.2 User Customization

| Customizable | Mechanism | UI Element |
|--------------|-----------|------------|
| **Which agents** | Attach/detach per stage | Drag-and-drop panel |
| **Agent behavior** | Custom prompts, temperature | Text areas, sliders |
| **Stage config** | JSON schema per stage | Dynamic form |
| **Weights** | Aggregation weight | Slider |
| **Enable/disable** | Toggle | Switch |

### 12.3 Output Consistency

| Aspect | Approach |
|--------|----------|
| **Schema** | Pydantic models per stage |
| **Validation** | All outputs validated before aggregation |
| **Envelope** | Standardized AgentResponse wrapper |
| **UI Rendering** | Stage-specific components |

---

## 13. References

### External Resources

- [Google Agent2Agent Protocol](https://github.com/a2aproject/A2A) - Foundation for agent discovery and communication
- [IBM A2A Overview](https://www.ibm.com/think/topics/agent2agent-protocol) - Protocol architecture details
- [Linux Foundation A2A Project](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) - Governance and ecosystem

### Internal Documents

- `ctc-principles-engineering.md` - CTC (Communication Through Coherence) principles translated to engineering patterns
- `04-app-design-document.md` - Core app architecture and features
- `03c-options-methodology.md` - Four-phase methodology that informs pipeline structure

---

## 14. Next Steps

1. **Implement Agent Registry** — Create service to register and discover agents
2. **Build Pipeline Orchestrator** — Core engine for running forecasting workflow
3. **Create Default Agents** — Implement agents for each stage with default prompts
4. **Build UI Components** — Agent configuration panel and pipeline visualization
5. **Integrate with App** — Connect to live data services and prediction tracking

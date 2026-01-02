# Cognitive UI Design: Multi-Agent Integration

## Applying Cognitive Design Principles to Agent-Augmented Forecasting

---

## 1. Executive Summary

This document provides a detailed cognitive design blueprint for integrating the multi-agent superforecaster system into the college football prediction app. It addresses five key challenges:

1. **Visualizing agent activity** without overwhelming users
2. **Configuring/customizing agents** per forecasting stage
3. **Showing agent outputs** flowing through the pipeline
4. **Maintaining cognitive load balance** during real-time agent work
5. **Designing agent creation/template** customization interfaces

The design is grounded in research from Tufte, Norman, Ware, Cleveland & McGill, Mayer, and Gestalt psychology.

---

## 2. Design Philosophy

### 2.1 Core Principle: Agents as Cognitive Amplifiers, Not Distractors

**Mental Model:** AI agents should feel like having expert advisors whispering insights, not a room full of people shouting simultaneously.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COGNITIVE DESIGN PRINCIPLES FOR AGENTS                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. AGENTS REDUCE LOAD    - Do work so humans don't have to                │
│                           - Summarize, not dump raw data                    │
│                           - Present conclusions, hide processing            │
│                                                                             │
│  2. AGENTS GUIDE ATTENTION - Highlight what matters                         │
│                           - Filter noise, surface signal                    │
│                           - Proactive alerts, not passive data             │
│                                                                             │
│  3. AGENTS SUPPORT DECISIONS - Recommendations with rationale              │
│                              - Confidence levels visible                    │
│                              - Easy to accept or override                   │
│                                                                             │
│  4. AGENTS STAY OUT OF WAY - Progressive disclosure of process             │
│                            - Details on demand, not by default             │
│                            - User remains in control                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Applying the Cognitive Design Pyramid

We apply the four-tier pyramid to agent integration:

```
        ┌─────────────────────────────────────┐
        │    BEHAVIORAL ALIGNMENT (T4)        │
        │    Agents guide user decisions      │
        │    Clear recommendations            │
        │    Easy to act on insights          │
        ├─────────────────────────────────────┤
        │    EMOTIONAL ENGAGEMENT (T3)        │
        │    Agents feel helpful, not scary   │
        │    Progress reduces anxiety         │
        │    Trust through transparency       │
        ├─────────────────────────────────────┤
        │    COGNITIVE COHERENCE (T2)         │
        │    Agent outputs make sense         │
        │    Pipeline stages logical          │
        │    Consistent terminology           │
        ├─────────────────────────────────────┤
        │    PERCEPTUAL EFFICIENCY (T1)       │
        │    Agent status visible at glance   │
        │    Clear hierarchy of outputs       │
        │    No visual noise from agents      │
        └─────────────────────────────────────┘
```

---

## 3. Challenge 1: Visualizing Agent Activity

### 3.1 The Problem

Multiple agents working simultaneously can create:
- **Visual noise** — too many status indicators
- **Attention fragmentation** — user doesn't know where to look
- **Cognitive overload** — tracking agent states exceeds 4±1 chunks

### 3.2 Design Solution: Layered Activity Visualization

**Principle Applied:** Progressive Disclosure + Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     THREE LEVELS OF AGENT VISIBILITY                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LEVEL 1: AMBIENT STATUS (Always Visible)                                  │
│  ─────────────────────────────────────────                                 │
│  • Single aggregate indicator in header                                    │
│  • Shows: "3 agents working" or "Analysis complete"                        │
│  • Color: Blue (working), Green (done), Red (error)                        │
│  • Click to expand to Level 2                                              │
│                                                                             │
│  Example:                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ [◉ 3 agents analyzing...]              Georgia vs Alabama        │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  LEVEL 2: PIPELINE OVERVIEW (On Demand)                                    │
│  ─────────────────────────────────────────                                 │
│  • Collapsible panel showing 7 stages as horizontal pipeline               │
│  • Each stage shows: status (pending/working/done), agent count            │
│  • Fits 4±1 chunks: group into 3-4 phase clusters                          │
│  • Click any stage to expand to Level 3                                    │
│                                                                             │
│  Example:                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ RESEARCH         │ ANALYSIS          │ VALIDATION    │ OUTPUT   │     │
│  │ [✓][✓]           │ [◉][◉]            │ [○]           │ [○]      │     │
│  │ RefClass BaseRate│ Evidence Bayesian │ Premortem     │ Synth    │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  LEVEL 3: STAGE DETAIL (Deep Dive)                                         │
│  ─────────────────────────────────────                                     │
│  • Modal or slide-out panel showing specific agents                        │
│  • Each agent: name, status, current action, output preview                │
│  • Shows processing time, confidence scores                                │
│  • Full output available via "View Details" link                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Design: Ambient Status Indicator

```typescript
// Ambient status component - always visible, minimal cognitive load

interface AmbientAgentStatus {
  totalAgents: number;
  workingAgents: number;
  completedAgents: number;
  errorAgents: number;
  currentPhase: string;
}

const AmbientAgentIndicator: React.FC<{ status: AmbientAgentStatus }> = ({ status }) => {
  // Determine aggregate state (single visual encoding)
  const state = status.errorAgents > 0 ? 'error'
    : status.workingAgents > 0 ? 'working'
    : 'complete';

  // Color coding: preattentive feature, but used sparingly
  const colors = {
    working: 'blue',    // Neutral activity
    complete: 'green',  // Positive completion
    error: 'red'        // Alert (truly exceptional)
  };

  // Single text summary - fits one chunk
  const summary = state === 'error'
    ? `${status.errorAgents} agent error`
    : state === 'working'
    ? `${status.workingAgents} agents analyzing...`
    : `Analysis complete`;

  return (
    <div className={`ambient-status ${state}`}>
      <StatusDot color={colors[state]} animated={state === 'working'} />
      <span className="status-text">{summary}</span>
      <ChevronIcon direction="down" />  {/* Affordance: expandable */}
    </div>
  );
};
```

### 3.4 Component Design: Pipeline Overview

**Cognitive Principles Applied:**
- **Chunking:** 7 stages grouped into 4 phases (Research, Analysis, Validation, Output)
- **Gestalt Proximity:** Stages within phase close together, phases separated
- **Visual Hierarchy:** Current phase highlighted, others dimmed
- **Natural Mapping:** Left-to-right flow matches temporal progression

```typescript
// Pipeline phases - chunked to fit 4±1 limit
const PIPELINE_PHASES = [
  {
    name: 'Research',
    stages: ['reference_class', 'base_rate'],
    description: 'Find historical context'
  },
  {
    name: 'Analysis',
    stages: ['evidence_gathering', 'bayesian_update'],
    description: 'Gather and process evidence'
  },
  {
    name: 'Validation',
    stages: ['premortem'],
    description: 'Challenge assumptions'
  },
  {
    name: 'Output',
    stages: ['synthesis', 'calibration'],
    description: 'Generate final estimate'
  }
];

const PipelineOverview: React.FC<{ context: ForecastContext }> = ({ context }) => {
  return (
    <div className="pipeline-overview">
      {PIPELINE_PHASES.map((phase, i) => (
        <div
          key={phase.name}
          className={`phase-group ${isCurrentPhase(phase, context) ? 'active' : ''}`}
        >
          {/* Phase header - clear labeling */}
          <div className="phase-header">
            <span className="phase-name">{phase.name}</span>
            <span className="phase-description">{phase.description}</span>
          </div>

          {/* Stages within phase - close proximity = related */}
          <div className="phase-stages">
            {phase.stages.map(stageId => (
              <StageIndicator
                key={stageId}
                stage={context.stages[stageId]}
                isActive={context.current_stage === stageId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Individual stage indicator - minimal but informative
const StageIndicator: React.FC<{ stage: StageStatus; isActive: boolean }> = ({
  stage,
  isActive
}) => {
  const icons = {
    pending: '○',    // Empty circle - not started
    working: '◉',    // Filled with dot - in progress
    complete: '✓',   // Checkmark - done
    error: '✗'       // X - problem
  };

  return (
    <div className={`stage-indicator ${stage.status} ${isActive ? 'active' : ''}`}>
      <span className="stage-icon">{icons[stage.status]}</span>
      <span className="stage-label">{stage.shortName}</span>
      {stage.agentCount > 0 && (
        <span className="agent-count">({stage.agentCount})</span>
      )}
    </div>
  );
};
```

### 3.5 Visual Design Specifications

```css
/* Ambient Status - Minimal footprint */
.ambient-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;  /* Affordance: clickable */
  transition: background 150ms;
}

.ambient-status:hover {
  background: rgba(0,0,0,0.05);  /* Feedback on hover */
}

.ambient-status.working { color: #2563eb; }
.ambient-status.complete { color: #16a34a; }
.ambient-status.error { color: #dc2626; }

/* Pipeline Overview - Chunked layout */
.pipeline-overview {
  display: flex;
  gap: 24px;  /* Large gap between phases - Gestalt separation */
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.phase-group {
  flex: 1;
  opacity: 0.6;  /* Inactive phases dimmed */
  transition: opacity 200ms;
}

.phase-group.active {
  opacity: 1;  /* Current phase full visibility */
}

.phase-stages {
  display: flex;
  gap: 8px;  /* Small gap within phase - Gestalt proximity */
}

/* Stage Indicator - Clear status encoding */
.stage-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  min-width: 60px;
}

.stage-indicator.active {
  background: #dbeafe;  /* Subtle highlight for current */
  font-weight: 600;
}

.stage-indicator.complete .stage-icon {
  color: #16a34a;
}

.stage-indicator.working .stage-icon {
  color: #2563eb;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 4. Challenge 2: Configuring/Customizing Agents Per Stage

### 4.1 The Problem

Agent configuration requires:
- Understanding which agents are available
- Deciding which to enable for each stage
- Customizing agent behavior (prompts, weights, parameters)

**Cognitive Risks:**
- Too many options → decision paralysis (Hick's Law)
- Complex configuration → errors and abandonment
- Abstract settings → lack of understanding

### 4.2 Design Solution: Guided Configuration with Defaults

**Principle Applied:** Recognition over Recall + Progressive Disclosure + Smart Defaults

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT CONFIGURATION DESIGN PATTERN                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: PRESET CONFIGURATIONS (Default Experience)                        │
│  ─────────────────────────────────────────────────────                      │
│  • 3-4 preset profiles: "Quick Analysis", "Deep Research", "Balanced"       │
│  • One-click selection, no configuration required                           │
│  • Each preset has clear description of what it does                        │
│  • "Custom" option for power users                                          │
│                                                                             │
│  Example:                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  Choose Analysis Mode:                                             │     │
│  │                                                                    │     │
│  │  [Quick]           [Balanced]           [Deep Research]           │     │
│  │   2 agents          5 agents             8 agents                  │     │
│  │   ~30 seconds       ~2 minutes           ~5 minutes                │     │
│  │   Basic evidence    Standard workflow    Comprehensive             │     │
│  │                        ▲                                           │     │
│  │                   RECOMMENDED                                      │     │
│  │                                                                    │     │
│  │  [+ Customize]  ← Progressive disclosure to Layer 2                │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  LAYER 2: STAGE-LEVEL CONFIGURATION (Intermediate)                          │
│  ─────────────────────────────────────────────────────                      │
│  • Toggle agents on/off per stage                                          │
│  • Visual representation of which agents are active                        │
│  • Brief description of each agent's purpose                               │
│  • "Advanced" link for detailed settings                                   │
│                                                                             │
│  LAYER 3: AGENT-LEVEL SETTINGS (Advanced)                                   │
│  ─────────────────────────────────────────                                 │
│  • Custom prompts                                                          │
│  • Temperature, token limits                                               │
│  • Weight in aggregation                                                   │
│  • Stage-specific parameters                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Component Design: Preset Selection

```typescript
// Preset configurations - reduce choices to 3-4 (fits working memory)
const AGENT_PRESETS = [
  {
    id: 'quick',
    name: 'Quick',
    description: 'Fast analysis with essential agents',
    agentCount: 2,
    estimatedTime: '~30 seconds',
    stages: {
      reference_class: ['historical-matchup-finder'],
      base_rate: [],  // Use cached
      evidence_gathering: ['evidence-web-search'],
      bayesian_update: ['bayesian-updater'],
      premortem: [],  // Skip
      synthesis: ['synthesis-coordinator'],
      calibration: []
    }
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Recommended for most analyses',
    recommended: true,
    agentCount: 5,
    estimatedTime: '~2 minutes',
    stages: {
      reference_class: ['historical-matchup-finder'],
      base_rate: ['base-rate-calculator'],
      evidence_gathering: ['evidence-web-search', 'injury-analyzer'],
      bayesian_update: ['bayesian-updater'],
      premortem: ['devils-advocate'],
      synthesis: ['synthesis-coordinator'],
      calibration: ['calibration-tracker']
    }
  },
  {
    id: 'deep',
    name: 'Deep Research',
    description: 'Comprehensive analysis with all available agents',
    agentCount: 8,
    estimatedTime: '~5 minutes',
    stages: {
      reference_class: ['historical-matchup-finder', 'context-analyzer'],
      base_rate: ['base-rate-calculator'],
      evidence_gathering: ['evidence-web-search', 'injury-analyzer', 'weather-conditions', 'social-sentiment'],
      bayesian_update: ['bayesian-updater'],
      premortem: ['devils-advocate', 'bias-detector'],
      synthesis: ['synthesis-coordinator'],
      calibration: ['calibration-tracker']
    }
  }
];

const PresetSelector: React.FC<{
  selected: string;
  onSelect: (presetId: string) => void;
  onCustomize: () => void;
}> = ({ selected, onSelect, onCustomize }) => {
  return (
    <div className="preset-selector">
      <h3>Choose Analysis Mode</h3>

      <div className="presets-grid">
        {AGENT_PRESETS.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={selected === preset.id}
            onSelect={() => onSelect(preset.id)}
          />
        ))}
      </div>

      {/* Progressive disclosure - advanced options hidden by default */}
      <button
        className="customize-link"
        onClick={onCustomize}
        aria-label="Customize agent configuration"
      >
        + Customize
      </button>
    </div>
  );
};

const PresetCard: React.FC<{
  preset: AgentPreset;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ preset, isSelected, onSelect }) => {
  return (
    <button
      className={`preset-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      {/* Clear visual hierarchy */}
      <div className="preset-header">
        <span className="preset-name">{preset.name}</span>
        {preset.recommended && (
          <span className="recommended-badge">Recommended</span>
        )}
      </div>

      {/* Key metrics - scannable */}
      <div className="preset-metrics">
        <span className="metric">{preset.agentCount} agents</span>
        <span className="metric">{preset.estimatedTime}</span>
      </div>

      {/* Description - explains what user gets */}
      <p className="preset-description">{preset.description}</p>

      {/* Selection indicator - clear feedback */}
      {isSelected && <CheckIcon className="selected-indicator" />}
    </button>
  );
};
```

### 4.4 Component Design: Stage-Level Configuration

**Cognitive Principles Applied:**
- **Recognition:** Show available agents as cards, not requiring recall
- **Gestalt Grouping:** Agents grouped by stage, clear visual separation
- **Immediate Feedback:** Toggle state changes instantly visible

```typescript
const StageConfigPanel: React.FC<{
  stage: string;
  availableAgents: AgentCard[];
  enabledAgents: string[];
  onToggle: (agentId: string) => void;
}> = ({ stage, availableAgents, enabledAgents, onToggle }) => {
  const stageInfo = STAGE_INFO[stage];

  return (
    <div className="stage-config-panel">
      {/* Stage context - user knows where they are */}
      <div className="stage-header">
        <span className="stage-number">{stageInfo.order}</span>
        <div className="stage-info">
          <h4 className="stage-name">{stageInfo.name}</h4>
          <p className="stage-description">{stageInfo.description}</p>
        </div>
      </div>

      {/* Agent cards - recognition over recall */}
      <div className="agent-cards">
        {availableAgents.map(agent => (
          <AgentToggleCard
            key={agent.id}
            agent={agent}
            isEnabled={enabledAgents.includes(agent.id)}
            onToggle={() => onToggle(agent.id)}
          />
        ))}
      </div>

      {/* Empty state with guidance */}
      {availableAgents.length === 0 && (
        <div className="empty-state">
          <p>No agents available for this stage.</p>
          <button className="create-agent-link">+ Create Custom Agent</button>
        </div>
      )}
    </div>
  );
};

const AgentToggleCard: React.FC<{
  agent: AgentCard;
  isEnabled: boolean;
  onToggle: () => void;
}> = ({ agent, isEnabled, onToggle }) => {
  return (
    <div className={`agent-toggle-card ${isEnabled ? 'enabled' : 'disabled'}`}>
      {/* Toggle - primary action, high affordance */}
      <Toggle
        checked={isEnabled}
        onChange={onToggle}
        aria-label={`Enable ${agent.name}`}
      />

      {/* Agent info - what does this agent do? */}
      <div className="agent-info">
        <span className="agent-name">{agent.name}</span>
        <p className="agent-description">{agent.description}</p>
      </div>

      {/* Quick preview of capabilities */}
      <div className="agent-capabilities">
        {agent.capabilities.actions.slice(0, 2).map(action => (
          <span key={action} className="capability-chip">{action}</span>
        ))}
      </div>

      {/* Progressive disclosure - advanced settings */}
      <button
        className="settings-button"
        aria-label={`Configure ${agent.name}`}
      >
        <SettingsIcon />
      </button>
    </div>
  );
};
```

### 4.5 Visual Design: Configuration Interface

```css
/* Preset Selector */
.preset-selector {
  max-width: 800px;
  margin: 0 auto;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 24px 0;
}

.preset-card {
  position: relative;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 150ms;
}

.preset-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.preset-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.recommended-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.preset-metrics {
  display: flex;
  gap: 12px;
  margin: 12px 0;
  font-size: 14px;
  color: #64748b;
}

.customize-link {
  display: block;
  margin: 0 auto;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
}

/* Agent Toggle Card */
.agent-toggle-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  transition: all 150ms;
}

.agent-toggle-card.enabled {
  border-color: #2563eb;
  background: #f8faff;
}

.agent-toggle-card.disabled {
  opacity: 0.7;
}

.capability-chip {
  display: inline-block;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 11px;
  color: #64748b;
}
```

---

## 5. Challenge 3: Showing Agent Outputs Flowing Through Pipeline

### 5.1 The Problem

Users need to:
- See what each agent found/decided
- Understand how outputs build on each other
- Trace the reasoning chain
- Trust the final result

**Cognitive Risks:**
- Raw agent outputs are too verbose
- Multiple outputs fragment attention
- No clear narrative flow

### 5.2 Design Solution: Narrative Flow Visualization

**Principle Applied:** Narrative Structure + Scrollytelling + Dual Coding

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT OUTPUT FLOW DESIGN                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DESIGN PATTERN: PROBABILITY STORY                                         │
│  ───────────────────────────────────                                       │
│                                                                             │
│  Show agent outputs as a visual story of how probability evolved:          │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                                                                    │    │
│  │  YOUR PROBABILITY JOURNEY: Georgia vs Alabama                      │    │
│  │                                                                    │    │
│  │  [Starting Point]                                                  │    │
│  │      57% ●────────────────────────────────────────────            │    │
│  │          │ Base Rate: Home team win rate in                       │    │
│  │          │ SEC rivalry games                                       │    │
│  │          │                                                        │    │
│  │          │ AGENT: historical-matchup-finder                       │    │
│  │          │ "Found 47 similar matchups since 2015"                 │    │
│  │          ▼                                                        │    │
│  │      62% ●────────────────────────────────────────────            │    │
│  │          │ Evidence: Georgia's QB listed as                       │    │
│  │          │ questionable (ankle injury)                            │    │
│  │          │                                                        │    │
│  │          │ AGENT: injury-analyzer                                 │    │
│  │          │ LR: 0.85 (favors Alabama)                              │    │
│  │          ▼                                                        │    │
│  │      58% ●────────────────────────────────────────────            │    │
│  │          │ Evidence: Heavy rain forecast (7pm kickoff)            │    │
│  │          │                                                        │    │
│  │          │ AGENT: weather-conditions                              │    │
│  │          │ LR: 0.95 (slight advantage to defense)                 │    │
│  │          ▼                                                        │    │
│  │      56% ●────────────────────────────────────────────            │    │
│  │                                                                    │    │
│  │  [PREMORTEM CHECK]                                                │    │
│  │  ⚠ 2 concerns raised by devils-advocate:                         │    │
│  │    • Georgia has won 3 straight in this matchup                   │    │
│  │    • Alabama's secondary is depleted                              │    │
│  │                                                                    │    │
│  │  [FINAL ESTIMATE]                                                 │    │
│  │      ┌─────────────────────────────────────────────┐              │    │
│  │      │  Georgia Win Probability: 56%               │              │    │
│  │      │  Confidence Interval: 48% - 64%             │              │    │
│  │      │  Market Price: 52% → EDGE: +4%              │              │    │
│  │      └─────────────────────────────────────────────┘              │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Component Design: Probability Journey

```typescript
interface ProbabilityStep {
  probability: number;
  source: 'base_rate' | 'evidence' | 'premortem' | 'synthesis';
  agent: string;
  summary: string;
  detail?: string;
  likelihoodRatio?: number;
  direction?: 'up' | 'down' | 'neutral';
}

const ProbabilityJourney: React.FC<{
  steps: ProbabilityStep[];
  finalEstimate: SynthesisOutput;
  marketPrice: number;
}> = ({ steps, finalEstimate, marketPrice }) => {
  return (
    <div className="probability-journey">
      <h3 className="journey-title">Your Probability Journey</h3>

      {/* Visual timeline of probability updates */}
      <div className="journey-timeline">
        {steps.map((step, index) => (
          <ProbabilityStep
            key={index}
            step={step}
            previousProbability={index > 0 ? steps[index - 1].probability : null}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {/* Final estimate - prominent, actionable */}
      <FinalEstimateCard
        estimate={finalEstimate}
        marketPrice={marketPrice}
      />
    </div>
  );
};

const ProbabilityStep: React.FC<{
  step: ProbabilityStep;
  previousProbability: number | null;
  isLast: boolean;
}> = ({ step, previousProbability, isLast }) => {
  const delta = previousProbability
    ? step.probability - previousProbability
    : 0;

  return (
    <div className={`probability-step ${step.source}`}>
      {/* Probability marker on visual scale */}
      <div className="probability-marker">
        <span className="probability-value">
          {(step.probability * 100).toFixed(0)}%
        </span>
        {delta !== 0 && (
          <span className={`delta ${delta > 0 ? 'up' : 'down'}`}>
            {delta > 0 ? '+' : ''}{(delta * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Connector line (unless last step) */}
      {!isLast && <div className="connector-line" />}

      {/* Step explanation */}
      <div className="step-content">
        <p className="step-summary">{step.summary}</p>

        {/* Agent attribution - builds trust */}
        <div className="step-agent">
          <AgentIcon />
          <span className="agent-name">{step.agent}</span>
          {step.likelihoodRatio && (
            <span className="likelihood-ratio">
              LR: {step.likelihoodRatio.toFixed(2)}
            </span>
          )}
        </div>

        {/* Expandable detail */}
        {step.detail && (
          <details className="step-detail">
            <summary>View details</summary>
            <p>{step.detail}</p>
          </details>
        )}
      </div>
    </div>
  );
};

const FinalEstimateCard: React.FC<{
  estimate: SynthesisOutput;
  marketPrice: number;
}> = ({ estimate, marketPrice }) => {
  const edge = estimate.final_probability - marketPrice;
  const hasEdge = Math.abs(edge) > 0.03;

  return (
    <div className={`final-estimate-card ${hasEdge ? 'has-edge' : ''}`}>
      {/* Primary number - largest visual element */}
      <div className="estimate-primary">
        <span className="estimate-value">
          {(estimate.final_probability * 100).toFixed(0)}%
        </span>
        <span className="estimate-label">Final Probability</span>
      </div>

      {/* Confidence interval - important context */}
      <div className="estimate-confidence">
        <ConfidenceBar
          low={estimate.confidence_interval[0]}
          high={estimate.confidence_interval[1]}
          estimate={estimate.final_probability}
        />
        <span className="confidence-label">
          {(estimate.confidence_interval[0] * 100).toFixed(0)}% -
          {(estimate.confidence_interval[1] * 100).toFixed(0)}%
        </span>
      </div>

      {/* Edge comparison - actionable insight */}
      <div className={`estimate-edge ${edge > 0 ? 'positive' : 'negative'}`}>
        <span className="market-price">
          Market: {(marketPrice * 100).toFixed(0)}%
        </span>
        <span className="edge-value">
          Edge: {edge > 0 ? '+' : ''}{(edge * 100).toFixed(1)}%
        </span>
      </div>

      {/* Recommendation - behavioral guidance */}
      <div className="estimate-recommendation">
        <RecommendationBadge recommendation={estimate.recommendation} />
      </div>
    </div>
  );
};
```

### 5.4 Visual Design: Probability Flow

```css
/* Probability Journey Container */
.probability-journey {
  max-width: 600px;
  margin: 24px auto;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
}

/* Timeline Layout */
.journey-timeline {
  position: relative;
  padding-left: 80px;  /* Space for probability markers */
}

.probability-step {
  position: relative;
  padding-bottom: 24px;
}

/* Probability Marker */
.probability-marker {
  position: absolute;
  left: -80px;
  width: 70px;
  text-align: right;
}

.probability-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.delta {
  display: block;
  font-size: 13px;
  font-weight: 500;
}

.delta.up { color: #16a34a; }
.delta.down { color: #dc2626; }

/* Connector Line */
.connector-line {
  position: absolute;
  left: -45px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #cbd5e1, #e2e8f0);
}

/* Step Content */
.step-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-left: 3px solid #e2e8f0;
}

.step-content:hover {
  border-left-color: #2563eb;
}

.step-summary {
  font-size: 15px;
  color: #334155;
  margin: 0 0 8px 0;
}

.step-agent {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.agent-name {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Final Estimate Card */
.final-estimate-card {
  margin-top: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  text-align: center;
}

.final-estimate-card.has-edge {
  border-color: #2563eb;
  background: linear-gradient(135deg, #eff6ff, white);
}

.estimate-primary {
  margin-bottom: 16px;
}

.estimate-value {
  display: block;
  font-size: 48px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.estimate-label {
  font-size: 14px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.estimate-edge.positive .edge-value {
  color: #16a34a;
  font-weight: 600;
}

.estimate-edge.negative .edge-value {
  color: #dc2626;
}
```

---

## 6. Challenge 4: Maintaining Cognitive Load Balance

### 6.1 The Problem

Real-time agent work creates:
- Constant visual updates competing for attention
- Uncertainty about completion time
- Anxiety about what's happening "behind the scenes"
- Interruption of user's own thinking

### 6.2 Design Solution: Ambient Awareness + Interruption Control

**Principle Applied:** Visibility of System Status + Emotional Calibration + User Control

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COGNITIVE LOAD MANAGEMENT STRATEGIES                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STRATEGY 1: AMBIENT STATUS (Low Cognitive Demand)                          │
│  ─────────────────────────────────────────────────                         │
│  • Single aggregate indicator (not per-agent updates)                       │
│  • Subtle animation for "working" state (not attention-grabbing)            │
│  • Progress bar shows overall completion (not per-stage)                   │
│  • Updates batched (every 2-3 seconds, not real-time streaming)            │
│                                                                             │
│  STRATEGY 2: INTERRUPTIBILITY CONTROL (User Agency)                         │
│  ─────────────────────────────────────────────────────                     │
│  • User can choose notification level:                                     │
│    - "Quiet" = Only alert on completion or error                           │
│    - "Normal" = Stage completion notifications                             │
│    - "Detailed" = Per-agent updates                                        │
│  • One-click "Pause" to stop agents if overwhelmed                         │
│  • "Skip to results" option to see current best estimate                   │
│                                                                             │
│  STRATEGY 3: PROGRESSIVE RESULTS (Reduce Waiting Anxiety)                   │
│  ────────────────────────────────────────────────────────                  │
│  • Show intermediate results as they become available                      │
│  • "Preliminary estimate" displayed early                                   │
│  • Results refine as more agents complete                                  │
│  • Clear indication: "Estimate may change as analysis continues"           │
│                                                                             │
│  STRATEGY 4: ASYNC OPTION (Work While Waiting)                              │
│  ─────────────────────────────────────────────────                         │
│  • "Analyze in background" option                                          │
│  • User can browse other games while analysis runs                         │
│  • Toast notification when complete                                        │
│  • Results saved and accessible from game card                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Component Design: Notification Preference Control

```typescript
type NotificationLevel = 'quiet' | 'normal' | 'detailed';

interface NotificationPreferences {
  level: NotificationLevel;
  soundEnabled: boolean;
  showIntermediateResults: boolean;
}

const NotificationControl: React.FC<{
  preferences: NotificationPreferences;
  onChange: (prefs: NotificationPreferences) => void;
}> = ({ preferences, onChange }) => {
  return (
    <div className="notification-control">
      <label className="control-label">Update frequency</label>

      <div className="level-options" role="radiogroup">
        <LevelOption
          level="quiet"
          label="Quiet"
          description="Only completion & errors"
          selected={preferences.level === 'quiet'}
          onSelect={() => onChange({ ...preferences, level: 'quiet' })}
          icon={<BellOffIcon />}
        />
        <LevelOption
          level="normal"
          label="Normal"
          description="Stage completions"
          selected={preferences.level === 'normal'}
          onSelect={() => onChange({ ...preferences, level: 'normal' })}
          icon={<BellIcon />}
        />
        <LevelOption
          level="detailed"
          label="Detailed"
          description="Every agent update"
          selected={preferences.level === 'detailed'}
          onSelect={() => onChange({ ...preferences, level: 'detailed' })}
          icon={<BellRingIcon />}
        />
      </div>

      <Toggle
        checked={preferences.showIntermediateResults}
        onChange={(checked) =>
          onChange({ ...preferences, showIntermediateResults: checked })
        }
        label="Show preliminary estimates"
      />
    </div>
  );
};
```

### 6.4 Component Design: Progress with Calm Animation

```typescript
const CalmProgressIndicator: React.FC<{
  progress: number;  // 0-1
  stage: string;
  estimatedTimeRemaining?: number;
}> = ({ progress, stage, estimatedTimeRemaining }) => {
  return (
    <div className="calm-progress">
      {/* Progress bar - fills smoothly, not jittery */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Text status - changes infrequently */}
      <div className="progress-text">
        <span className="current-stage">{stage}</span>
        {estimatedTimeRemaining && (
          <span className="time-remaining">
            ~{Math.ceil(estimatedTimeRemaining / 1000)}s remaining
          </span>
        )}
      </div>
    </div>
  );
};
```

```css
/* Calm Progress Animation */
.calm-progress {
  width: 100%;
  max-width: 400px;
}

.progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 2px;
  /* Smooth transition - not jarring */
  transition: width 500ms ease-out;
}

/* Subtle pulsing glow - visible but not distracting */
.progress-fill {
  animation: subtle-glow 2s ease-in-out infinite;
}

@keyframes subtle-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
  50% {
    box-shadow: 0 0 8px 2px rgba(37, 99, 235, 0.3);
  }
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}
```

---

## 7. Challenge 5: Agent Creation/Template Customization Interface

### 7.1 The Problem

Power users want to create custom agents with:
- Custom system prompts
- Stage-specific configurations
- Modified output schemas
- Integration with external tools

**Cognitive Risks:**
- Complex configuration requires expert knowledge
- Easy to create broken configurations
- No feedback on what will happen

### 7.2 Design Solution: Guided Builder with Preview

**Principle Applied:** Wizard Pattern + Inline Validation + Live Preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT BUILDER DESIGN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  APPROACH: 4-STEP WIZARD WITH LIVE PREVIEW                                 │
│                                                                             │
│  Step 1: PURPOSE       What does this agent do?                            │
│  Step 2: CONFIGURATION How should it behave?                               │
│  Step 3: OUTPUT        What format should results take?                    │
│  Step 4: TEST & SAVE   Verify it works                                     │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                                                                    │    │
│  │  Create Custom Agent                                               │    │
│  │                                                                    │    │
│  │  [1 Purpose]────[2 Config]────[3 Output]────[4 Test]              │    │
│  │      ●             ○             ○             ○                   │    │
│  │                                                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │ STEP 1: Define Purpose                                      │  │    │
│  │  │                                                              │  │    │
│  │  │ Name your agent:                                            │  │    │
│  │  │ ┌────────────────────────────────────────────────────────┐  │  │    │
│  │  │ │ Weather Impact Analyzer                                 │  │  │    │
│  │  │ └────────────────────────────────────────────────────────┘  │  │    │
│  │  │                                                              │  │    │
│  │  │ What stage will it work in?                                 │  │    │
│  │  │ ┌────────────────────────────────────────────────────────┐  │  │    │
│  │  │ │ Evidence Gathering                              ▼      │  │  │    │
│  │  │ └────────────────────────────────────────────────────────┘  │  │    │
│  │  │                                                              │  │    │
│  │  │ Describe what it does (for other users):                    │  │    │
│  │  │ ┌────────────────────────────────────────────────────────┐  │  │    │
│  │  │ │ Analyzes weather conditions for the game location      │  │  │    │
│  │  │ │ and estimates impact on team performance based on      │  │  │    │
│  │  │ │ historical data for similar conditions.                │  │  │    │
│  │  │ └────────────────────────────────────────────────────────┘  │  │    │
│  │  │                                                              │  │    │
│  │  │                              [Back]  [Continue →]           │  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  LIVE PREVIEW                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │ ┌──────────────────────────────────────────────────────┐   │  │    │
│  │  │ │ [○] Weather Impact Analyzer                          │   │  │    │
│  │  │ │     Stage: Evidence Gathering                        │   │  │    │
│  │  │ │     Analyzes weather conditions for the game...      │   │  │    │
│  │  │ └──────────────────────────────────────────────────────┘   │  │    │
│  │  │ This is how your agent will appear in the stage config.    │  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Component Design: Agent Builder Wizard

```typescript
const AgentBuilderWizard: React.FC<{
  onComplete: (agent: CustomAgent) => void;
  onCancel: () => void;
}> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Partial<CustomAgent>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, name: 'Purpose', component: PurposeStep },
    { number: 2, name: 'Config', component: ConfigStep },
    { number: 3, name: 'Output', component: OutputStep },
    { number: 4, name: 'Test', component: TestStep }
  ];

  const CurrentStepComponent = steps[step - 1].component;

  return (
    <div className="agent-builder-wizard">
      {/* Progress indicator - externalizes state */}
      <div className="wizard-progress">
        {steps.map(s => (
          <div
            key={s.number}
            className={`progress-step ${s.number === step ? 'active' : ''} ${s.number < step ? 'complete' : ''}`}
          >
            <span className="step-number">{s.number}</span>
            <span className="step-name">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Split layout: form + preview */}
      <div className="wizard-content">
        {/* Form section */}
        <div className="wizard-form">
          <CurrentStepComponent
            draft={draft}
            onChange={setDraft}
            errors={errors}
          />
        </div>

        {/* Live preview - immediate feedback */}
        <div className="wizard-preview">
          <h4>Live Preview</h4>
          <AgentCardPreview agent={draft} />
          <p className="preview-hint">
            This is how your agent will appear in the stage config.
          </p>
        </div>
      </div>

      {/* Navigation - clear actions */}
      <div className="wizard-navigation">
        <button
          className="btn-secondary"
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
        >
          {step > 1 ? 'Back' : 'Cancel'}
        </button>
        <button
          className="btn-primary"
          onClick={() => step < 4 ? setStep(step + 1) : handleComplete()}
          disabled={!isStepValid(step, draft)}
        >
          {step < 4 ? 'Continue' : 'Create Agent'}
        </button>
      </div>
    </div>
  );
};
```

### 7.4 Component Design: Prompt Template Editor

**Key Cognitive Principles:**
- **Dual Coding:** Show template AND rendered preview
- **Inline Validation:** Highlight syntax errors immediately
- **Memory Aid:** Variable suggestions as you type

```typescript
const PromptTemplateEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  availableVariables: Variable[];
  sampleContext: Record<string, any>;
}> = ({ value, onChange, availableVariables, sampleContext }) => {
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState<SyntaxError[]>([]);

  // Update preview when template or context changes
  useEffect(() => {
    try {
      const rendered = renderTemplate(value, sampleContext);
      setPreview(rendered);
      setErrors([]);
    } catch (e) {
      setErrors([e as SyntaxError]);
    }
  }, [value, sampleContext]);

  return (
    <div className="prompt-template-editor">
      {/* Variable reference panel - recognition over recall */}
      <div className="variable-reference">
        <h5>Available Variables</h5>
        <div className="variable-list">
          {availableVariables.map(v => (
            <button
              key={v.name}
              className="variable-chip"
              onClick={() => insertVariable(v.name)}
              title={v.description}
            >
              {`{{${v.name}}}`}
            </button>
          ))}
        </div>
      </div>

      {/* Split editor with preview */}
      <div className="editor-split">
        {/* Template editor */}
        <div className="template-section">
          <label>System Prompt Template</label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={errors.length > 0 ? 'has-error' : ''}
            placeholder="Enter your prompt template..."
          />
          {/* Inline error display */}
          {errors.length > 0 && (
            <div className="error-message">
              {errors[0].message}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="preview-section">
          <label>Preview (with sample data)</label>
          <div className="rendered-preview">
            {preview || 'Preview will appear here...'}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 8. Integration with Existing App Features

### 8.1 Feature Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT INTEGRATION WITH CORE FEATURES                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FEATURE 1: LIVE DASHBOARD                                                 │
│  ─────────────────────────                                                 │
│  Agent Integration:                                                        │
│  • "Analyze" button on each game card triggers agent pipeline              │
│  • Game cards show agent status indicator when analysis running            │
│  • Quick insights from agents shown as badges on cards                     │
│  • Batch analyze option for multiple games                                 │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ #3 Georgia @ #1 Alabama     LIVE Q3 8:42     [◉ Analyzing...]    │    │
│  │ ...                                                               │    │
│  │ [EDGE: +8%] [Agent: 3 factors found]              [View Analysis] │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  FEATURE 2: EDGE CALCULATOR                                                │
│  ──────────────────────────                                                │
│  Agent Integration:                                                        │
│  • "Auto-estimate" button uses agents to suggest probability              │
│  • Agent reasoning shown alongside user's manual estimate                 │
│  • Comparison: "Your estimate: 65% | Agent estimate: 62%"                 │
│  • Option to adopt agent's estimate or keep own                           │
│                                                                             │
│  FEATURE 3: BAYESIAN WORKBENCH                                             │
│  ────────────────────────────                                              │
│  Agent Integration:                                                        │
│  • Agents automatically populate evidence panel                           │
│  • Each evidence item shows source agent                                  │
│  • Suggested likelihood ratios from agents (user can override)            │
│  • "Add agent evidence" button to trigger more research                   │
│  • Full probability journey visualization (Section 5 design)              │
│                                                                             │
│  FEATURE 4: STRATEGY SIMULATOR                                             │
│  ────────────────────────────                                              │
│  Agent Integration:                                                        │
│  • Agents can suggest correlated positions                                │
│  • "Hedge suggestions" from synthesis agent                               │
│  • Risk analysis augmented by agent premortem output                      │
│                                                                             │
│  FEATURE 5: PORTFOLIO TRACKER                                              │
│  ────────────────────────────                                              │
│  Agent Integration:                                                        │
│  • Track which positions used agent analysis vs manual                    │
│  • Performance comparison: agent-assisted vs unassisted                   │
│                                                                             │
│  FEATURE 6: PERFORMANCE ANALYTICS                                          │
│  ───────────────────────────────                                           │
│  Agent Integration:                                                        │
│  • Agent accuracy tracking (were agent estimates better calibrated?)      │
│  • Per-agent performance metrics                                          │
│  • Identify which agents add most value                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 UI Layout: Integrated Game Analysis View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ [Logo]  Dashboard  Analyze  Portfolio  Settings     [◉ 3 analyzing]  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │                                 │  │                                 │ │
│  │  GAME ANALYSIS                  │  │  AGENT PANEL                    │ │
│  │  Georgia vs Alabama             │  │                                 │ │
│  │                                 │  │  [Pipeline Overview]            │ │
│  │  ┌───────────────────────────┐  │  │  Research → Analysis →          │ │
│  │  │                           │  │  │  Validation → Output            │ │
│  │  │   YOUR ESTIMATE           │  │  │  [✓][✓]   [◉][○]   [○]   [○]   │ │
│  │  │                           │  │  │                                 │ │
│  │  │   [    65%     ]          │  │  │  ─────────────────────────────  │ │
│  │  │   Slider                  │  │  │                                 │ │
│  │  │                           │  │  │  LATEST OUTPUT                  │ │
│  │  │   Market: 60%             │  │  │                                 │ │
│  │  │   Edge: +5%               │  │  │  [evidence-web-search]          │ │
│  │  │                           │  │  │  Found 3 relevant articles:     │ │
│  │  └───────────────────────────┘  │  │  • Georgia QB questionable     │ │
│  │                                 │  │  • Weather: rain expected       │ │
│  │  ┌───────────────────────────┐  │  │  • Line movement analysis      │ │
│  │  │                           │  │  │                                 │ │
│  │  │  AGENT SUGGESTION         │  │  │  [View Full Output]             │ │
│  │  │                           │  │  │                                 │ │
│  │  │  56% ± 6%                 │  │  │  ─────────────────────────────  │ │
│  │  │  Based on 5 agents        │  │  │                                 │ │
│  │  │                           │  │  │  [+ Configure Agents]           │ │
│  │  │  [Use This] [See Why]     │  │  │                                 │ │
│  │  │                           │  │  │                                 │ │
│  │  └───────────────────────────┘  │  └─────────────────────────────────┘ │
│  │                                 │                                      │
│  │  [BAYESIAN WORKBENCH]           │                                      │
│  │  [Probability Journey Chart]    │                                      │
│  │                                 │                                      │
│  └─────────────────────────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Accessibility Considerations

### 9.1 WCAG Compliance for Agent UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ACCESSIBILITY REQUIREMENTS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COLOR & CONTRAST                                                          │
│  • All status indicators use icon + text (not color alone)                 │
│  • Minimum 4.5:1 contrast for body text, 3:1 for large text                │
│  • Agent status colors have colorblind-safe alternatives                   │
│                                                                             │
│  KEYBOARD NAVIGATION                                                       │
│  • All agent controls keyboard accessible                                  │
│  • Focus indicators visible on all interactive elements                    │
│  • Tab order follows visual hierarchy                                      │
│  • Escape closes modals and panels                                         │
│                                                                             │
│  SCREEN READERS                                                            │
│  • Status changes announced via aria-live regions                          │
│  • Agent descriptions in aria-label attributes                             │
│  • Progress updates announced at key milestones                            │
│  • Form validation errors announced immediately                            │
│                                                                             │
│  MOTION & ANIMATION                                                        │
│  • Respect prefers-reduced-motion                                          │
│  • Progress animations can be disabled                                     │
│  • No content depends on motion to be understood                           │
│                                                                             │
│  COGNITIVE ACCESSIBILITY                                                   │
│  • Simple language in agent descriptions                                   │
│  • Consistent terminology throughout                                       │
│  • Error messages explain how to fix issues                                │
│  • Timeout warnings before session expiry                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Implementation Example: Accessible Status

```typescript
const AccessibleAgentStatus: React.FC<{ status: AgentStatus }> = ({ status }) => {
  // Determine announcement text
  const announcement = status.state === 'working'
    ? `${status.workingCount} agents currently analyzing. ${status.progress}% complete.`
    : status.state === 'complete'
    ? 'Analysis complete.'
    : `Error in ${status.errorCount} agents.`;

  return (
    <div
      className={`agent-status ${status.state}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Visual indicator - not relied upon alone */}
      <StatusIcon state={status.state} aria-hidden="true" />

      {/* Text label - always present */}
      <span className="status-text">{announcement}</span>

      {/* Progress for screen readers */}
      {status.state === 'working' && (
        <progress
          value={status.progress}
          max={100}
          aria-label="Analysis progress"
        />
      )}
    </div>
  );
};
```

---

## 10. Summary: Cognitive Design Checklist for Agent UI

### 10.1 Perceptual Efficiency (Tier 1)

- [ ] Agent status visible at a glance (ambient indicator)
- [ ] Clear visual hierarchy (primary KPIs > agent activity > details)
- [ ] Status colors used sparingly (red only for true errors)
- [ ] Sufficient contrast for all text and indicators
- [ ] Animations subtle and non-distracting

### 10.2 Cognitive Coherence (Tier 2)

- [ ] Pipeline stages chunked into 4±1 phases
- [ ] Terminology consistent (same terms for same concepts)
- [ ] Agent outputs follow logical narrative flow
- [ ] Current state always visible (what stage, what's running)
- [ ] Progressive disclosure (overview → detail on demand)

### 10.3 Emotional Engagement (Tier 3)

- [ ] Progress reduces anxiety (clear timeline, completion %)
- [ ] User control maintained (pause, skip, configure)
- [ ] Agent suggestions feel helpful, not threatening
- [ ] Errors provide clear recovery path
- [ ] Success states are celebrated (completion confirmation)

### 10.4 Behavioral Alignment (Tier 4)

- [ ] Recommendations are clear and actionable
- [ ] Primary actions prominent (use estimate, view details)
- [ ] Confidence levels help calibrate decisions
- [ ] Easy to adopt or override agent suggestions
- [ ] Clear path from analysis to trading action

---

## 11. Related Documentation

- **04-app-design-document.md** — Core app architecture and features
- **05-multi-agent-superforecaster-architecture.md** — Agent protocol and data flow
- **Cognitive Design Skill Resources** — Frameworks, foundations, evaluation tools

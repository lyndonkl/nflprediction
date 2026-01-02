'use client';

import { clsx } from 'clsx';
import { Check, Clock, Zap, Search, Settings } from 'lucide-react';
import type { AgentPreset } from '@/types';

const DEFAULT_PRESETS: AgentPreset[] = [
  {
    id: 'quick',
    name: 'Quick',
    description: 'Fast analysis with essential agents',
    agentCount: 2,
    estimatedTimeSeconds: 30,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Recommended for most analyses',
    agentCount: 5,
    estimatedTimeSeconds: 120,
    recommended: true,
  },
  {
    id: 'deep',
    name: 'Deep Research',
    description: 'Comprehensive analysis with all agents',
    agentCount: 8,
    estimatedTimeSeconds: 300,
  },
];

interface PresetSelectorProps {
  selected: AgentPreset['id'];
  onSelect: (presetId: AgentPreset['id']) => void;
  onCustomize?: () => void;
  presets?: AgentPreset[];
  disabled?: boolean;
}

/**
 * Preset Selector - Reduces cognitive load through smart defaults
 *
 * Cognitive Design Principles:
 * - 3-4 preset profiles (fits working memory)
 * - One-click selection, no configuration required
 * - Clear description of what each preset does
 * - Progressive disclosure: "Customize" for power users
 */
export function PresetSelector({
  selected,
  onSelect,
  onCustomize,
  presets = DEFAULT_PRESETS,
  disabled = false,
}: PresetSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Choose Analysis Mode</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={selected === preset.id}
            onSelect={() => onSelect(preset.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Progressive disclosure - advanced options */}
      {onCustomize && (
        <button
          onClick={onCustomize}
          className={clsx(
            'flex items-center gap-1 mx-auto text-sm text-blue-600 hover:text-blue-700',
            'focus:outline-none focus:underline',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
        >
          <Settings className="w-4 h-4" />
          <span>Customize agents</span>
        </button>
      )}
    </div>
  );
}

interface PresetCardProps {
  preset: AgentPreset;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function PresetCard({ preset, isSelected, onSelect, disabled }: PresetCardProps) {
  const Icon = preset.id === 'quick' ? Zap : preset.id === 'deep' ? Search : Clock;

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={clsx(
        'relative flex flex-col p-4 rounded-lg border-2 text-left transition-all',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300 bg-white',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      role="radio"
      aria-checked={isSelected}
    >
      {/* Recommended badge */}
      {preset.recommended && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full">
          Recommended
        </span>
      )}

      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={clsx(
          'w-5 h-5',
          isSelected ? 'text-blue-600' : 'text-slate-400'
        )} />
        <span className={clsx(
          'font-semibold',
          isSelected ? 'text-blue-900' : 'text-slate-900'
        )}>
          {preset.name}
        </span>
      </div>

      {/* Metrics - scannable */}
      <div className="flex gap-3 mb-2 text-sm text-slate-500">
        <span>{preset.agentCount} agents</span>
        <span>~{formatTime(preset.estimatedTimeSeconds)}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600">{preset.description}</p>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute bottom-3 right-3">
          <Check className="w-5 h-5 text-blue-600" />
        </div>
      )}
    </button>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

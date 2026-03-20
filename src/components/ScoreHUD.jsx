import { Shield, Info } from 'lucide-react';
import { PHASES } from '../gameState';

const PHASE_LABELS = {
  [PHASES.PHASE1]: { label: 'Triage & Volatility', num: 1 },
  [PHASES.PHASE2]: { label: 'Acquisition & Redundancy', num: 2 },
  [PHASES.PHASE3]: { label: 'Log Analysis & Attribution', num: 3 },
  [PHASES.DEBRIEF]: { label: 'Debrief', num: null },
};

export default function ScoreHUD({ phase, admissibilityScore, onLegend }) {
  const phaseInfo = PHASE_LABELS[phase];
  const scoreColor = admissibilityScore >= 80 ? '#22c55e' : admissibilityScore >= 55 ? '#f59e0b' : '#ef4444';

  const phases = [
    { key: PHASES.PHASE1, label: 'Triage', num: 1 },
    { key: PHASES.PHASE2, label: 'Acquisition', num: 2 },
    { key: PHASES.PHASE3, label: 'Attribution', num: 3 },
  ];

  const currentPhaseNum = phaseInfo?.num;
  const getPhaseStatus = (num) => {
    if (!currentPhaseNum) return 'done';
    if (num < currentPhaseNum) return 'done';
    if (num === currentPhaseNum) return 'active';
    return 'pending';
  };

  return (
    <header style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 1.5rem',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 700,
    }}>
      {/* Left: brand */}
      <div className="flex items-center gap-2">
        <Shield size={18} style={{ color: 'var(--color-primary)' }} />
        <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>CloudTrace</span>
        <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>The Ephemeral Evidence</span>
      </div>

      {/* Center: phase stepper */}
      {phaseInfo && currentPhaseNum && (
        <div className="flex items-center gap-0">
          {phases.map((p, i) => {
            const status = getPhaseStatus(p.num);
            return (
              <div key={p.key} className="flex items-center">
                <div className={`phase-step ${status}`}>
                  <div className={`phase-dot ${status}`}>
                    {status === 'done' ? '✓' : p.num}
                  </div>
                  <span className="hidden sm:block text-xs">{p.label}</span>
                </div>
                {i < phases.length - 1 && (
                  <div className={`phase-line ${status === 'done' ? 'active' : ''}`} style={{ margin: '0 0.5rem' }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Right: score + legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Admissibility:</span>
          <span className="font-mono font-bold text-sm" style={{ color: scoreColor }}>
            {admissibilityScore}%
          </span>
          <div style={{ width: 48, height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${admissibilityScore}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={onLegend} data-tooltip="Open Legend & Glossary (ℹ)">
          <Info size={15} />
        </button>
      </div>
    </header>
  );
}

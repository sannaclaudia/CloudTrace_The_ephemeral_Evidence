import { Shield, Info, Briefcase, Clock, Target } from 'lucide-react';
import { PHASES } from '../gameState';

const PHASE_LABELS = {
  [PHASES.PHASE1]: { label: 'Triage & Volatility', num: 1 },
  [PHASES.PHASE2]: { label: 'Acquisition & Redundancy', num: 2 },
  [PHASES.PHASE3]: { label: 'Log Analysis & Attribution', num: 3 },
  [PHASES.DEBRIEF]: { label: 'Debrief', num: null },
};

export default function ScoreHUD({ phase, admissibilityScore, onLegend, onLocker, lockerOpen, state }) {
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

  // Count collected evidence for locker badge
  const evidenceCount = [
    state?.networkIsolated,
    state?.processesIdentified,
    state?.snapshotTaken,
    state?.phase2Correct,
    state?.attackChainCompleted,
    state?.phase3Correct,
  ].filter(Boolean).length;

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isUrgent = state?.timeLeft <= 300 && state?.timeLeft > 0;

  return (
    <header style={{
      flexShrink: 0,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 1.5rem',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 700,
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

      {/* Right: score + modes + timer + buttons */}
      <div className="flex items-center gap-4">
        
        {/* Game Mode */}
        {state?.gameMode && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <Target size={12} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{state.gameMode}</span>
          </div>
        )}

        {/* Timer */}
        {state?.timerMode && state.timerMode !== 'Story' && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${isUrgent ? 'countdown-urgent' : ''}`} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <Clock size={12} style={{ color: isUrgent ? '#ef4444' : 'var(--color-primary)' }} />
            <span className="font-mono text-xs font-bold" style={{ color: isUrgent ? '#ef4444' : 'var(--color-text)' }}>
              {formatTime(state.timeLeft)}
            </span>
          </div>
        )}

        {/* Score */}
        <div id="score-hud" className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Admissibility:</span>
          <span className="font-mono font-bold text-sm" style={{ color: scoreColor }}>{admissibilityScore}%</span>
          <div style={{ width: 52, height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${admissibilityScore}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Evidence Locker button */}
        <button
          id="evidence-locker-btn"
          className="btn btn-ghost"
          style={{
            padding: '0.25rem 0.5rem', position: 'relative',
            ...(lockerOpen ? { background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.5)', color: '#a5b4fc' } : {}),
          }}
          onClick={onLocker}
          data-tooltip="Evidence Locker"
        >
          <Briefcase size={14} />
          {evidenceCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 15, height: 15, borderRadius: '50%',
              background: 'var(--color-primary)', color: 'white',
              fontSize: '0.55rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--color-surface)',
            }}>{evidenceCount}</span>
          )}
        </button>

        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={onLegend} data-tooltip="Legend & Glossary">
          <Info size={14} />
        </button>
      </div>
    </header>
  );
}

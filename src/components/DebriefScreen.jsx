import { RotateCcw, CheckCircle, XCircle, Target, BookOpen } from 'lucide-react';
import { ACTIONS } from '../gameState';

const GRADE = (score) => {
  if (score >= 125) return { letter: 'S+', label: 'Legendary Forensics Expert', color: '#8b5cf6' };
  if (score >= 100) return { letter: 'S', label: 'Master Investigator', color: '#a855f7' };
  if (score >= 90) return { letter: 'A', label: 'Expert Investigator', color: '#22c55e' };
  if (score >= 75) return { letter: 'B', label: 'Proficient Analyst',  color: '#86efac' };
  if (score >= 55) return { letter: 'C', label: 'Adequate Response',   color: '#f59e0b' };
  return { letter: 'F', label: 'Evidence Compromised', color: '#ef4444' };
};

const LESSONS = [
  {
    phase: 'Phase 1 — Isolation vs. Suspension',
    icon: '💨',
    lesson: 'In cloud environments, immediate isolation (Network Security Group modification) is the only forensically sound containment method. Suspending the VM (ACPI sleep) or powering it off permanently destroys active processes, network connections, and fileless malware residing in RAM. You must isolate, verify the RUNNING state, and then use the CSP\'s Snapshot API to capture live memory.',
    ref: 'NIST SP 800-86 §4.2 — Live Data Collection; ACPO Principle 2',
  },
  {
    phase: 'Phase 2 — Multi-Criteria Replica Analysis',
    icon: '🗄️',
    lesson: 'Cloud data redundancy creates forensic traps. A matching cryptographic hash does NOT identify the Primary Copy — it only proves data integrity. To establish admissibility, you must find the source bucket by checking the oldest LastModified timestamp, the absence of a ReplicationTimestamp, full object count, and enabled Versioning. Replicas suffer from replication lag and async write corruption.',
    ref: 'ISO/IEC 27037:2012 §7.3 — Acquisition of Digital Evidence in Network Environments',
  },
  {
    phase: 'Phase 3 — Role Assumption Chain Tracing',
    icon: '📋',
    lesson: 'Advanced threat actors rarely use stolen permanent credentials (AKIA...) directly for malicious actions. They pivot using STS AssumeRole to generate temporary session tokens (ASIA...). The resulting malicious API calls (like RunInstances) will show an internal AWS service endpoint as the source IP. Investigators must trace the sessionContext backwards to the originating AssumeRole event to find the true attacker IP and root compromised credential.',
    ref: 'CISA Cloud Security Technical Reference Architecture §6.1 — Logging and Monitoring',
  },
  {
    phase: 'Master\'s Concept — Cloud Forensics Peculiarities',
    icon: '☁️',
    lesson: 'Cloud environments break traditional physical-seizure assumptions. Investigators must deal with multi-tenancy (preventing physical access), ephemeral resources (auto-terminating VMs), and heavy provider dependency. Cloud logs can have critical completeness gaps if data-plane events aren\'t configured, and sanitization operations (like crypto-erase) can permanently destroy evidence unless WORM-like retention is used.',
    ref: 'Lecture 26 (Cloud Forensics Peculiarities) — Multi-tenancy, IaaS Evidence, WORM Storage',
  },
];

export default function DebriefScreen({ state, dispatch }) {
  const multiplier = state.gameMode === 'Final Exam' ? 1.5 : state.gameMode === 'Challenge' ? 1.25 : 1.0;
  const finalScore = Math.round(state.admissibilityScore * multiplier);
  const grade = GRADE(finalScore);
  const won = !state.gameOver;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">{won ? '🏆' : '📋'}</div>
        <h1 className="text-2xl font-bold mb-1">
          {state.gameOverReason === 'poweroff'
            ? 'Investigation Failed: Evidence Destroyed'
            : state.gameOverReason === 'timeout'
            ? 'Investigation Failed: Instance Terminated'
            : 'Investigation Complete'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {won
            ? 'You successfully traced the attack and identified the perpetrator.'
            : 'The investigation was unable to be completed due to forensic procedure violations.'}
        </p>
      </div>

      <div className="card mb-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-dim)' }}>
          Final Admissibility Score
        </div>
        <div className="text-7xl font-bold mb-1" style={{ color: grade.color, fontFamily: 'JetBrains Mono, monospace' }}>
          {finalScore}
        </div>
        <div className="text-sm mb-4" style={{ color: 'var(--color-text-dim)' }}>
          Base Score: {state.admissibilityScore}% × {multiplier}x Multiplier ({state.gameMode})
        </div>
        <div className="text-lg mb-2" style={{ color: grade.color }}>
          Grade {grade.letter} — {grade.label}
        </div>
        <div className="progress-bar" style={{ maxWidth: 300, margin: '0 auto' }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, finalScore)}%`, background: grade.color }} />
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold">Investigative Actions Taken</span>
        </div>
        {state.actions.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No actions recorded.</div>
        ) : (
          <div className="space-y-2">
            {state.actions.map((action, i) => (
              <div key={i} className="flex gap-3 items-start text-sm p-2 rounded" style={{
                background: action.correct ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${action.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {action.correct
                  ? <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                  : <XCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />}
                <div>
                  <div className="font-medium">
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>Phase {action.phase}</span>
                    {' · '}
                    {action.action}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{action.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold">Chain of Custody &amp; Evidence Integrity Report</span>
        </div>
        <div className="space-y-3 font-mono text-xs" style={{ background: '#0a0d14', padding: '1rem', borderRadius: 6, border: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>[PHASE 1] Volatile RAM Image Hash (SHA-256):</div>
            <div style={{ color: state.snapshotTaken ? '#86efac' : '#ef4444', wordBreak: 'break-all' }}>
              {state.snapshotTaken ? 'sha256:4d8123a105f63... (Snapshot acquired safely)' : 'N/A — Evidence destroyed or not acquired'}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          <div>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>[PHASE 2] S3 Bucket Copy Integrity Hash (SHA-256):</div>
            <div style={{ color: state.phase2Correct ? '#86efac' : '#ef4444', wordBreak: 'break-all' }}>
              {state.phase2Correct ? 'sha256:a9f2e1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1' : 'N/A — Primary copy not correctly acquired'}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          <div>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>[SANITIZATION WARNING] Data Preservation Status:</div>
            <div style={{ color: state.phase2Correct ? '#86efac' : '#f59e0b' }}>
              {state.phase2Correct ? 'Evidence secured before lifecycle deletion policy triggered.' : 'Warning: Unsecured data is at risk of Purge-level sanitization via crypto-erase.'}
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold">Master's Level Educational Takeaways</span>
        </div>
        <div className="space-y-4">
          {LESSONS.map(({ phase, icon, lesson, ref }) => (
            <div key={phase} style={{ padding: '0.875rem', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{icon}</span>
                <span className="font-semibold text-sm">{phase}</span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{lesson}</p>
              <div className="text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>📚 {ref}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="btn btn-primary"
          style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}
          onClick={() => dispatch({ type: ACTIONS.RESET_GAME })}
        >
          <RotateCcw size={16} />
          Play Again
        </button>
      </div>
    </div>
  );
}

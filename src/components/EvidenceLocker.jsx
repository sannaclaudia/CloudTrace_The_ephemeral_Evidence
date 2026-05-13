import { X, Lock, Unlock, Camera, Database, FileText, Activity } from 'lucide-react';

const EVIDENCE_ITEMS = [
  {
    id: 'network_isolation',
    phase: 1,
    icon: '🔒',
    title: 'Network Isolation Record',
    desc: 'VPC Security Group modified. All ingress/egress rules removed at timestamp.',
    check: (s) => s.networkIsolated,
  },
  {
    id: 'process_tree',
    phase: 1,
    icon: '📋',
    title: 'Process Tree Analysis',
    desc: 'PIDs 4812, 7834, 9344 flagged as hostile. Scope established for memory acquisition.',
    check: (s) => s.processesIdentified,
  },
  {
    id: 'memory_snapshot',
    phase: 1,
    icon: '📸',
    title: 'RAM Snapshot — snap-0abc1234def56789a',
    desc: '32 GB logical memory block. Acquired via CSP API on running instance.',
    check: (s) => s.snapshotTaken,
  },
  {
    id: 'primary_bucket',
    phase: 2,
    icon: '🗄️',
    title: 'Primary S3 Bucket Identified',
    desc: 'eu-west-1a confirmed as primary copy: oldest LastModified, no ReplicationTimestamp, versioning enabled.',
    check: (s) => s.phase2Correct,
  },
  {
    id: 'attack_chain',
    phase: 3,
    icon: '🔗',
    title: 'Attack Chain Reconstruction',
    desc: 'Full 6-step attack path verified: credential theft → recon → 2× AssumeRole pivot → RunInstances → exfiltration.',
    check: (s) => s.attackChainCompleted,
  },
  {
    id: 'attribution',
    phase: 3,
    icon: '🎯',
    title: 'Final Attribution Report',
    desc: 'Attacker IP: 185.220.101.47 | Key: AKIAIOSFODNN7DEV01A3 | Role: AutomationServiceRole',
    check: (s) => s.phase3Correct,
  },
];

const PHASE_LABELS = { 1: 'Phase 1 — Triage', 2: 'Phase 2 — Acquisition', 3: 'Phase 3 — Attribution' };
const PHASE_COLORS = { 1: '#ef4444', 2: '#6366f1', 3: '#f59e0b' };

export default function EvidenceLocker({ state, onClose }) {
  const collected = EVIDENCE_ITEMS.filter(e => e.check(state));
  const pct = Math.round((collected.length / EVIDENCE_ITEMS.length) * 100);

  const grouped = [1, 2, 3].reduce((acc, p) => {
    acc[p] = EVIDENCE_ITEMS.filter(e => e.phase === p);
    return acc;
  }, {});

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0, zIndex: 799, background: 'rgba(0,0,0,0.3)' }}
      />
      <div className="evidence-locker">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold text-sm">Evidence Locker</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem' }}>
            <X size={15} />
          </button>
        </div>

        {/* Progress */}
        <div className="card mb-4" style={{ padding: '0.875rem' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Evidence Collected</span>
            <span className="font-mono text-sm font-bold" style={{ color: pct === 100 ? '#22c55e' : 'var(--color-primary)' }}>{collected.length}/{EVIDENCE_ITEMS.length}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : 'var(--color-primary)' }} />
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
            {pct === 100 ? '✓ Full evidentiary record established' : `${100 - pct}% of evidence chain incomplete`}
          </div>
        </div>

        {/* Items by phase */}
        {[1, 2, 3].map(phase => (
          <div key={phase} className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: PHASE_COLORS[phase] }}>
              {PHASE_LABELS[phase]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {grouped[phase].map(item => {
                const unlocked = item.check(state);
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 8,
                      background: unlocked ? 'rgba(34,197,94,0.06)' : 'var(--color-bg)',
                      border: `1px solid ${unlocked ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
                      opacity: unlocked ? 1 : 0.5,
                      transition: 'all 0.3s',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: 1 }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {unlocked
                            ? <Unlock size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
                            : <Lock size={11} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
                          }
                          <span className="font-semibold text-xs" style={{ color: unlocked ? 'var(--color-text)' : 'var(--color-text-dim)' }}>
                            {item.title}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-dim)', lineHeight: 1.5 }}>
                          {unlocked ? item.desc : '[Not yet collected]'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Chain of Custody note */}
        <div style={{
          marginTop: '0.5rem', padding: '0.75rem', borderRadius: 8,
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
          fontSize: '0.7rem', color: 'var(--color-text-dim)', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: 4 }}>📜 Chain of Custody Notice</strong>
          All evidence items are timestamped at collection time. Gaps in this record may reduce admissibility in legal proceedings. Maintain procedural integrity per ACPO Principle 2.
        </div>
      </div>
    </>
  );
}

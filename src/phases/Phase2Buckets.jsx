import { useState } from 'react';
import { Database, Search, ChevronRight, ChevronDown, CheckCircle, ShieldAlert, Cpu, AlertTriangle, Lock } from 'lucide-react';
import { ACTIONS } from '../gameState';
import bucketsData from '../data/buckets.json';
import { HelpCircle } from 'lucide-react';

const HINTS = [
  'A primary bucket is the original source. Replicas are copies. Look for the oldest LastModified timestamp.',
  'True primary buckets do not have a ReplicationTimestamp.',
  'Always verify the SHA-256 hash to ensure evidence hasn\'t been tampered with, and check the lifecycle policy to ensure evidence isn\'t scheduled for deletion.'
];

// SHA-256 simulated hashes for each bucket
const BUCKET_HASHES = {
  'replica-a':  'sha256:a9f2e1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
  'replica-b': 'sha256:a9f2e1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
  'replica-c': 'sha256:b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
};

// Simulated lifecycle policies — one bucket has a deletion policy set by attacker
const LIFECYCLE_POLICIES = {
  'replica-a':  { hasDeletion: false, policy: 'No expiration rules configured.' },
  'replica-b': { hasDeletion: true,  policy: 'DANGER: Expiration rule detected — objects with prefix "/" deleted after 1 day. Attacker-set lifecycle rule! Evidence at risk.' },
  'replica-c': { hasDeletion: false, policy: 'No expiration rules configured.' },
};

export default function Phase2Buckets({ state, dispatch, addToast }) {
  const [expanded, setExpanded] = useState(null);
  const [inspectingObjects, setInspectingObjects] = useState(null);
  const [integrityRunning, setIntegrityRunning] = useState(false);
  const [integrityDone, setIntegrityDone] = useState({});
  const [wrongModal, setWrongModal] = useState(false);
  const [lifecycleChecked, setLifecycleChecked] = useState({});
  const [lifecycleRunning, setLifecycleRunning] = useState(false);
  const hintsUsed = state.hintsUsed?.p2 || 0;

  const handleUseHint = () => {
    if (hintsUsed >= 3) return;
    dispatch({ type: ACTIONS.USE_HINT, payload: { phase: 'p2' } });
    addToast({ type: 'info', title: `Hint ${hintsUsed + 1}/3 Unlocked`, message: '−5 Admissibility' });
  };

  const displayBuckets = state.gameMode === 'Challenge' ? bucketsData.map(b => {
    if (b.id === 'replica-a') return { ...b, isPrimary: false, name: 'backup-replica-east', notes: 'Replica bucket. Files are copied here.' };
    if (b.id === 'replica-b') return { ...b, isPrimary: true, name: 'primary-storage-prod', notes: 'Source bucket. The original location of the files.' };
    if (b.id === 'replica-c') return { ...b, isPrimary: false, name: 'disaster-recovery-asia', notes: 'Secondary async replica. Out of sync.' };
    return b;
  }) : bucketsData;

  const handleSelect = (id) => {
    if (state.phase2Correct) return;
    dispatch({ type: ACTIONS.SELECT_BUCKET, payload: id });
  };

  const handleConfirm = () => {
    if (!integrityDone[state.selectedBucketId]) {
      addToast({ type: 'warning', title: 'Forensic Error', message: 'You must compute the SHA-256 hash to prove evidence integrity before confirming.' });
      return;
    }
    if (!lifecycleChecked[state.selectedBucketId]) {
      addToast({ type: 'warning', title: 'Forensic Error', message: 'You must verify the lifecycle policy to ensure evidence is not scheduled for deletion.' });
      return;
    }

    const selected = displayBuckets.find(b => b.id === state.selectedBucketId);
    if (!selected.isPrimary) {
      dispatch({ type: ACTIONS.PHASE2_CONFIRM, payload: { buckets: displayBuckets } });
      setWrongModal(true);
    } else {
      dispatch({ type: ACTIONS.PHASE2_CONFIRM, payload: { buckets: displayBuckets } });
    }
  };

  const runIntegrityCheck = (bucketId) => {
    if (integrityRunning || integrityDone[bucketId]) return;
    setIntegrityRunning(true);
    handleSelect(bucketId);
    setTimeout(() => {
      setIntegrityDone(prev => ({ ...prev, [bucketId]: true }));
      setIntegrityRunning(false);
      addToast({ type: 'info', title: 'SHA-256 Integrity Check Complete', message: 'Hash computed. Compare source and working-copy hashes to verify admissibility.' });
    }, 1500);
  };

  const runLifecycleCheck = (bucketId) => {
    if (lifecycleRunning || lifecycleChecked[bucketId]) return;
    setLifecycleRunning(true);
    handleSelect(bucketId);
    setTimeout(() => {
      const policy = LIFECYCLE_POLICIES[bucketId];
      setLifecycleChecked(prev => ({ ...prev, [bucketId]: policy }));
      setLifecycleRunning(false);
      if (policy.hasDeletion) {
        addToast({ type: 'error', title: '⚠ Lifecycle Deletion Policy Detected!', message: 'Evidence destruction scheduled. Crypto-erase risk — capture immediately.' });
      } else {
        addToast({ type: 'success', title: 'Lifecycle Check Clean', message: 'No scheduled deletion or crypto-erase policy found.' });
      }
    }, 1200);
  };

  return (
    <div style={{ padding: '2rem 2.5rem', minHeight: 'calc(100vh - 64px)' }}>
      <div id="step2-intro" className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold mb-0.5">Phase 2: Acquisition & Redundancy</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            The target S3 backup bucket is replicated across 3 regions. For legal admissibility, 
            you must acquire data ONLY from the <strong>Primary Source</strong> exactly as it was written. 
            Identify the original primary bucket based on forensic metadata.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {state.gameMode === 'Guided' && (
            <button className="btn btn-ghost" onClick={handleUseHint} disabled={hintsUsed >= 3}>
              <HelpCircle size={16} /> Request Hint ({3 - hintsUsed} left)
            </button>
          )}
        </div>
      </div>

      {hintsUsed > 0 && (
        <div className="card mb-6" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: '#818cf8' }}>
            <HelpCircle size={16} />
            <span className="font-bold text-sm">Active Hints</span>
          </div>
          <ul className="text-sm space-y-2" style={{ color: 'var(--color-text)', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            {HINTS.slice(0, hintsUsed).map((hint, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: hint }} />
            ))}
          </ul>
        </div>
      )}

      <div id="bucket-grid" className="grid gap-4 md:grid-cols-3 mb-6">
        {displayBuckets.map(bucket => {
          const isSelected = state.selectedBucketId === bucket.id;
          const isExpanded = expanded === bucket.id;
          
          return (
            <div 
              key={bucket.id} 
              className={`card hover-border ${isSelected ? 'border-primary' : ''}`}
              style={{ cursor: state.phase2Correct ? 'default' : 'pointer', padding: '1.25rem', position: 'relative' }}
              onClick={() => handleSelect(bucket.id)}
            >
              {isSelected && (
                <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 3, background: 'var(--color-primary)' }} />
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <Database size={18} style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-dim)' }} />
                <span className="font-bold text-sm tracking-wide" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  {bucket.zone}
                </span>
              </div>

              <div className="text-xs mb-4" style={{ color: 'var(--color-text-dim)' }}>{bucket.region}</div>

              {/* Raw AWS Metadata (Harder) */}
              <div className="space-y-1.5 mb-4 font-mono" style={{ fontSize: '0.65rem', background: '#0a0d14', padding: '0.75rem', borderRadius: 4, color: '#94a3b8' }}>
                {Object.entries(bucket.awsMetadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 overflow-hidden">
                    <span style={{ color: '#475569' }}>{k}:</span>
                    <span className="truncate" style={{ color: v === 'COMPLETED' ? '#22c55e' : '#cbd5e1' }}>{v || 'null'}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                <button 
                  className="btn btn-ghost" 
                  style={{ width: '100%', fontSize: '0.75rem' }}
                  onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : bucket.id); }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {isExpanded ? 'Hide Details' : 'View Full Details'}
                </button>

                <button 
                   className={`btn ${integrityDone[bucket.id] ? 'btn-ghost' : ''}`}
                   style={{ width: '100%', fontSize: '0.75rem', borderColor: integrityDone[bucket.id] ? 'var(--color-border)' : '#6366f1' }}
                   onClick={(e) => { e.stopPropagation(); runIntegrityCheck(bucket.id); }}
                   disabled={integrityRunning || integrityDone[bucket.id]}
                >
                   {integrityRunning && state.selectedBucketId === bucket.id ? <Cpu size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                   {integrityDone[bucket.id] ? 'SHA-256 Hash Verified' : 'Run SHA-256 Integrity Check'}
                </button>

                <button
                  className={`btn ${lifecycleChecked[bucket.id] ? 'btn-ghost' : ''}`}
                  style={{ width: '100%', fontSize: '0.75rem', borderColor: lifecycleChecked[bucket.id] ? (lifecycleChecked[bucket.id].hasDeletion ? '#ef4444' : 'var(--color-border)') : '#f59e0b', color: lifecycleChecked[bucket.id]?.hasDeletion ? '#fca5a5' : undefined }}
                  onClick={(e) => { e.stopPropagation(); runLifecycleCheck(bucket.id); }}
                  disabled={lifecycleRunning || !!lifecycleChecked[bucket.id]}
                >
                  {lifecycleRunning ? <Cpu size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                  {lifecycleChecked[bucket.id] ? (lifecycleChecked[bucket.id].hasDeletion ? '⚠ Deletion Policy Found!' : 'No Lifecycle Risk') : 'Check Lifecycle Policy'}
                </button>
              </div>

              {/* SHA-256 integrity hash output */}
              {integrityDone[bucket.id] && (
                <div className="mt-3 p-2 rounded text-xs" style={{ background: '#060910', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}>
                  <div style={{ color: 'var(--color-text-dim)', marginBottom: '0.3rem', fontSize: '0.65rem' }}>$ sha256sum bucket-manifest.json</div>
                  <div style={{ color: '#86efac', wordBreak: 'break-all' }}>{BUCKET_HASHES[bucket.id]}</div>
                  <div style={{ color: 'var(--color-text-dim)', marginTop: '0.4rem', fontSize: '0.65rem' }}>SHA-256 preferred over MD5 — collision resistance required for court admissibility (Lec 5)</div>
                </div>
              )}
              {/* Lifecycle policy result */}
              {lifecycleChecked[bucket.id] && (
                <div className="mt-2 p-2 rounded text-xs" style={{
                  background: lifecycleChecked[bucket.id].hasDeletion ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.06)',
                  border: `1px solid ${lifecycleChecked[bucket.id].hasDeletion ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
                  color: lifecycleChecked[bucket.id].hasDeletion ? '#fca5a5' : '#86efac',
                  lineHeight: 1.6,
                }}>
                  {lifecycleChecked[bucket.id].policy}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Details Pane */}
      {expanded && (() => {
        const bucket = displayBuckets.find(b => b.id === expanded);
        return (
          <div className="card mb-6" style={{ background: 'var(--color-surface-2)' }}>
            <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
              <Search size={16} style={{ color: 'var(--color-primary)' }} />
              Forensic Metadata: {bucket.zone}
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              <div className="space-y-3">
                <div className="text-xs">
                  <div style={{ color: 'var(--color-text-dim)' }}>Versioning</div>
                  <div className="font-mono">{bucket.versioningEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div className="text-xs">
                  <div style={{ color: 'var(--color-text-dim)' }}>Object Count</div>
                  <div className="font-mono">{bucket.objectCount}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-xs">
                  <div style={{ color: 'var(--color-text-dim)' }}>Last Modified</div>
                  <div className="font-mono">{bucket.lastModified}</div>
                </div>
                <div className="text-xs">
                  <div style={{ color: 'var(--color-text-dim)' }}>Replication Timestamp</div>
                  <div className="font-mono" style={{ color: bucket.replicationTimestamp ? '#f59e0b' : 'var(--color-text)' }}>
                    {bucket.replicationTimestamp || 'null'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs">
                  <div style={{ color: 'var(--color-text-dim)' }}>Storage Class</div>
                  <div className="font-mono">{bucket.storageClass}</div>
                </div>
                <div className="text-xs">
                  <div style={{ color: 'var(--color-text-dim)' }}>Bucket Policy</div>
                  <div className="font-mono">{bucket.bucketPolicy}</div>
                </div>
              </div>
            </div>

            {/* Object Inspector */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button 
                className="btn btn-ghost mb-3" 
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={() => setInspectingObjects(inspectingObjects === bucket.id ? null : bucket.id)}
              >
                {inspectingObjects === bucket.id ? 'Hide Objects' : 'Inspect Objects Inside Bucket'}
              </button>

              {inspectingObjects === bucket.id && (
                <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
                      <th className="pb-2 font-mono">ObjectKey</th>
                      <th className="pb-2 font-mono">LastModified</th>
                      <th className="pb-2 font-mono">Size</th>
                      <th className="pb-2 font-mono">Content-MD5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bucket.objects.map((obj, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="py-2 font-mono" style={{ color: '#c7d2fe' }}>{obj.key}</td>
                        <td className="py-2 font-mono text-gray-400">{obj.lastModified}</td>
                        <td className="py-2 font-mono text-gray-400">{obj.size}</td>
                        <td className="py-2 font-mono truncate max-w-[120px]" style={{ color: '#86efac' }}>{obj.contentMD5}</td>
                      </tr>
                    ))}
                    {bucket.objects.length < 3 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center font-mono" style={{ color: '#ef4444' }}>
                          [WARN] Only {bucket.objects.length} objects found in bucket manifest.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg" style={{ background: '#0a0d14', border: '1px solid var(--color-border)' }}>
        <div className="text-sm">
          Selected Target: 
          <span className="font-bold ml-2 font-mono" style={{ color: state.selectedBucketId ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
            {state.selectedBucketId ? displayBuckets.find(b => b.id === state.selectedBucketId).name : 'None selected'}
          </span>
        </div>
        <button 
          className="btn btn-primary" 
          disabled={!state.selectedBucketId || state.phase2Correct}
          onClick={handleConfirm}
        >
          <CheckCircle size={16} /> Confirm Primary Copy Selection
        </button>
      </div>

      {/* Data Sanitization Awareness Card */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Lock size={14} style={{ color: '#f59e0b' }} />
          <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>Evidence Preservation — Data Sanitization Awareness (Lec 22)</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)', lineHeight: 1.75 }}>
          In cloud environments, data can be silently destroyed through{' '}
          <span style={{ color: '#fbbf24' }}>crypto-erase</span> (deleting the KMS encryption key makes S3 objects permanently unrecoverable — even from replicas) or{' '}
          <span style={{ color: '#fbbf24' }}>lifecycle deletion policies</span> (scheduled object expiration).
          Use the <em>"Check Lifecycle Policy"</em> button on each bucket before confirming your selection.{' '}
          NIST defines three sanitization levels: <strong style={{ color: '#e2e8f0' }}>Clear</strong>, <strong style={{ color: '#e2e8f0' }}>Purge</strong> (crypto-erase), and <strong style={{ color: '#e2e8f0' }}>Destroy</strong>.
          <br /><br />
          <span style={{ color: '#a5b4fc', fontWeight: 'bold' }}>☁️ Cloud Mitigation (Lecture 26):</span> To prevent evidence tampering, cloud providers offer <strong style={{ color: '#e2e8f0' }}>WORM-like retention</strong> (Write Once, Read Many). Features like S3 Object Lock prevent even the root account owner from deleting or overwriting the evidence during the investigation window.
        </div>
      </div>

      {wrongModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-center mb-2" style={{ color: '#ef4444' }}>
              Incorrect Primary Copy
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              You selected a replica bucket. Replicas are not authoritative sources of evidence due to potential replication lag, missing objects, or async write corruption.
            </p>
            <div className="p-3 rounded mb-4 text-sm" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#c7d2fe' }}>
              <strong>Analyst Guidance:</strong>
              <ul className="mt-2 space-y-2 text-xs opacity-90 list-disc pl-4">
                <li>A matching cryptographic hash only proves data integrity, not origin.</li>
                <li>Look for the <em>oldest</em> LastModified timestamp.</li>
                <li>True primary buckets do not have a <code>ReplicationTimestamp</code>.</li>
              </ul>
            </div>
            <button className="btn btn-primary w-full" onClick={() => setWrongModal(false)}>
              Re-evaluate Evidence (−20 Admissibility)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

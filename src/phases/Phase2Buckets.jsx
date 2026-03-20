import { useState, useMemo } from 'react';
import { Database, Search, ChevronRight, ChevronDown, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { ACTIONS } from '../gameState';
import bucketsData from '../data/buckets.json';

export default function Phase2Buckets({ state, dispatch, addToast }) {
  const [expanded, setExpanded] = useState(null);
  const [inspectingObjects, setInspectingObjects] = useState(null);
  const [integrityRunning, setIntegrityRunning] = useState(false);
  const [integrityDone, setIntegrityDone] = useState({});
  const [wrongModal, setWrongModal] = useState(false);

  const handleSelect = (id) => {
    if (state.phase2Correct) return;
    dispatch({ type: ACTIONS.SELECT_BUCKET, payload: id });
  };

  const handleConfirm = () => {
    const selected = bucketsData.find(b => b.id === state.selectedBucketId);
    if (!selected.isPrimary) {
      dispatch({ type: ACTIONS.PHASE2_CONFIRM, payload: { buckets: bucketsData } });
      setWrongModal(true);
    } else {
      dispatch({ type: ACTIONS.PHASE2_CONFIRM, payload: { buckets: bucketsData } });
    }
  };

  const runIntegrityCheck = (bucketId) => {
    if (integrityRunning || integrityDone[bucketId]) return;
    setIntegrityRunning(true);
    setTimeout(() => {
      setIntegrityDone(prev => ({ ...prev, [bucketId]: true }));
      setIntegrityRunning(false);
      addToast({ type: 'info', title: 'Integrity Check Complete', message: `Computed hash for bucket root metadata.` });
    }, 1500);
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-0.5">Phase 2: Acquisition & Redundancy</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          The target S3 backup bucket is replicated across 3 regions. For legal admissibility, 
          you must acquire data ONLY from the <strong>Primary Source</strong> exactly as it was written. 
          Identify the original primary bucket based on forensic metadata.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {bucketsData.map(bucket => {
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
                   {integrityDone[bucket.id] ? 'Integrity Hash Verified' : 'Run Integrity Check'}
                </button>
              </div>

              {/* Integrity status (Trap for students) */}
              {integrityDone[bucket.id] && (
                <div className="mt-3 p-2 rounded text-xs font-mono" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', wordBreak: 'break-all' }}>
                  {bucket.integrityHash}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Details Pane */}
      {expanded && (() => {
        const bucket = bucketsData.find(b => b.id === expanded);
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
            {state.selectedBucketId ? bucketsData.find(b => b.id === state.selectedBucketId).name : 'None selected'}
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

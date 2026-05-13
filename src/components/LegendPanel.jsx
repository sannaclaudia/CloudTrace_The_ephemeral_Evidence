import { X, BookOpen, Palette, Tag } from 'lucide-react';

const GLOSSARY = [
  { term: 'CSP', def: 'Cloud Service Provider — the company that owns and operates the physical infrastructure (e.g., AWS, Azure, GCP). In cloud forensics, all hardware access is mediated by the CSP.' },
  { term: 'Volatility', def: 'The ephemeral nature of cloud resources. RAM contents, running processes, and network connections exist only while an instance is running. Terminating the VM destroys this data permanently.' },
  { term: 'Snapshot', def: 'A CSP-provided API call that captures the current memory or disk state of a VM without requiring physical hardware access. The only valid RAM acquisition method in the cloud.' },
  { term: 'CloudTrail', def: 'AWS audit logging service that records every API call made in an AWS account, including who made it, from where, and when. The digital equivalent of a visitors\' logbook.' },
  { term: 'Primary Copy', def: 'In a replicated storage environment, the authoritative original. Replicas may have lag, missing objects, or disabled versioning. Only the Primary Copy is admissible as forensic evidence.' },
  { term: 'Redundancy', def: 'Cloud data is replicated across multiple geographic regions for high availability. This creates multiple copies of evidence, requiring the investigator to identify the authoritative source.' },
  { term: 'API Call', def: 'The mechanism for interacting with cloud services. Since there is no physical access, all forensic actions (snapshot, isolate, acquire) are performed via authenticated API calls to the CSP.' },
  { term: 'Admissibility Score', def: 'A measure of how well the investigation follows forensically sound procedures. Every violation (wrong action, evidence contamination) reduces this score and may invalidate evidence in court.' },
];

const COLOR_KEY = [
  { color: '#22c55e', label: 'Correct / Verified', desc: 'Action follows forensic best practices' },
  { color: '#ef4444', label: 'Error / Tampered',   desc: 'Action violates forensic procedures or evidence is suspect' },
  { color: '#f59e0b', label: 'Warning / Suspicious', desc: 'Requires closer inspection — may be anomalous' },
  { color: '#6366f1', label: 'Primary / Active',   desc: 'Current selection or authoritative source' },
  { color: '#94a3b8', label: 'Inactive / Replica', desc: 'Secondary or non-authoritative data' },
];

export default function LegendPanel({ onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0, zIndex: 799, background: 'rgba(0,0,0,0.4)' }}
      />

      <div className="legend-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold">Legend & Glossary</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.25rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Color Key */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <Palette size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Color Key
            </span>
          </div>
          <div className="space-y-2">
            {COLOR_KEY.map(({ color, label, desc }) => (
              <div key={label} className="flex gap-2.5 items-start">
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: color, flexShrink: 0, marginTop: 3
                }} />
                <div>
                  <div className="font-medium text-xs">{label}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '1.25rem' }} />

        {/* Glossary */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Tag size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Forensic Glossary
            </span>
          </div>
          <div className="space-y-4">
            {GLOSSARY.map(({ term, def }) => (
              <div key={term}>
                <div className="font-semibold text-xs mb-0.5" style={{ color: 'var(--color-primary)' }}>{term}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{def}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-xs p-3 rounded" style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: 'var(--color-text-dim)',
        }}>
          This panel is accessible at any time during the investigation via the ℹ button in the header.
        </div>
      </div>
    </>
  );
}

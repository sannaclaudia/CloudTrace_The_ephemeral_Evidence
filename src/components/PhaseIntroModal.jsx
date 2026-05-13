import { useState } from 'react';

const PHASE_DATA = {
  PHASE1: {
    phaseNumber: 1,
    forensicPhases: 'Identification  →  Collection',
    icon: '🔍',
    accentColor: '#ef4444',
    accentBg: 'rgba(239,68,68,0.1)',
    accentBorder: 'rgba(239,68,68,0.35)',
    subtitle: 'Triage & Volatility',
    summary:
      'In the Identification phase you enumerate every source of evidence without modifying it. ' +
      'In Collection you physically or logically secure those sources. In cloud forensics (IaaS models), ' +
      'you have no physical hardware access — you must rely on provider APIs to isolate the network ' +
      'before ephemeral resources like RAM are overwritten or auto-scalers terminate the instance.',
    principles: [
      { icon: '⚡', label: 'Volatility First', text: 'RAM → network state → disk. The most ephemeral data must be captured first (NIST SP 800-86 §4.2).' },
      { icon: '🔒', label: 'Logical Isolation', text: 'Severing all ingress/egress is the cloud equivalent of a Faraday bag — it stops remote wipe commands and ongoing exfiltration.' },
      { icon: '☁️', label: 'IaaS Constraints & Multi-tenancy', text: 'Physical seizure is impossible because the hypervisor is shared with other tenants. Evidence must be collected logically via the Cloud Service Provider APIs.' },
    ],
    whatToDo: [
      'Isolate the instance network before touching anything else',
      'Identify malicious processes to scope the memory acquisition',
      'Verify the instance is RUNNING, then take the RAM snapshot',
    ],
    reference: 'Atzeni – Lectures 4 & 5 (Phases) · Vaciago – Lecture 26 (Cloud Peculiarities)',
  },
  PHASE2: {
    phaseNumber: 2,
    forensicPhases: 'Acquisition',
    icon: '📦',
    accentColor: '#6366f1',
    accentBg: 'rgba(99,102,241,0.1)',
    accentBorder: 'rgba(99,102,241,0.35)',
    subtitle: 'Evidence Acquisition',
    summary:
      'Acquisition is the creation of a forensically sound copy of the collected evidence using trusted tools ' +
      'in a controlled environment. The cardinal rule: never work directly on original evidence. ' +
      'All examination must be performed on verified copies — and the source and image hashes must match.',
    principles: [
      { icon: '#️⃣', label: 'Hash Before & After', text: 'Compute SHA-256 of the source before imaging and of the copy after. Matching hashes prove integrity. MD5 alone is insufficient — known collision vulnerabilities make it legally challengeable.' },
      { icon: '🔁', label: 'Primary vs Replica', text: 'A replica bucket may have replication lag, missing objects, or async write corruption. Only the primary source is authoritative evidence.' },
      { icon: '🛡️', label: 'WORM Retention & Sanitization', text: 'Data sanitization policies (crypto-erase) can destroy evidence. WORM-like storage (Write Once, Read Many) such as S3 Object Lock prevents even the account owner from tampering with evidence.' },
    ],
    whatToDo: [
      'Inspect the S3 bucket forensic metadata carefully',
      'Identify the primary bucket (no ReplicationTimestamp, oldest timestamp)',
      'Run an integrity check and confirm the SHA-256 hash',
      'Verify no active lifecycle deletion policy threatens the evidence',
    ],
    reference: 'Lecture 5 (Acquisition) · Lecture 22 (Sanitization) · Lecture 26 (WORM Cloud Retention)',
  },
  PHASE3: {
    phaseNumber: 3,
    forensicPhases: 'Examination  →  Evaluation',
    icon: '🔬',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.1)',
    accentBorder: 'rgba(245,158,11,0.35)',
    subtitle: 'Log Analysis & Attribution',
    summary:
      'Examination is the analytical work performed on forensic copies to extract findings, correlate ' +
      'evidence, and build a chronological narrative. A single evidence source is always weak — you need ' +
      'cross-correlation across independent sources. Sophisticated attackers use anti-forensic techniques ' +
      'such as role chaining to obscure their true origin.',
    principles: [
      { icon: '📅', label: 'Timeline Construction', text: 'Map every log event to a timestamp. Clock skew between systems must be corrected. The attacker\'s true IP only appears in pre-pivot events.' },
      { icon: '🎭', label: 'Anti-Forensics: Role Chaining', text: 'AssumeRole generates temporary credentials and masks the caller IP. Like HTTPS hiding payloads, it obscures attribution. Trace the sessionContext chain backwards to the permanent key.' },
      { icon: '📑', label: 'Log Completeness & Integrity', text: 'Cloud environments separate management logs from data-plane logs. If data events aren\'t explicitly configured, the forensic timeline will have critical gaps.' },
    ],
    whatToDo: [
      'Scan CloudTrail logs and build a mental timeline of events',
      'Reconstruct the full attack chain in chronological order',
      'Identify the source IP — remember: ec2.amazonaws.com is NOT the attacker',
      'Find the permanent AKIA... credential and the role that executed RunInstances',
    ],
    reference: 'Lecture 13 (Correlative Analysis) · Lecture 26 (Cloud Logs Peculiarities)',
  },
};

export default function PhaseIntroModal({ phase, onBegin }) {
  const data = PHASE_DATA[phase];
  if (!data) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(6px)', backgroundColor: 'rgba(2,4,12,0.88)' }}>
      <div
        className="modal"
        style={{
          maxWidth: 640,
          width: '92vw',
          border: `1px solid ${data.accentBorder}`,
          background: 'linear-gradient(145deg, #0d1117 0%, #0a0d18 100%)',
          boxShadow: `0 0 60px ${data.accentBg}, 0 24px 64px rgba(0,0,0,0.6)`,
          padding: '2rem',
        }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{data.icon}</div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
                color: data.accentColor, textTransform: 'uppercase',
                padding: '0.2rem 0.6rem', borderRadius: 4,
                background: data.accentBg, border: `1px solid ${data.accentBorder}`,
              }}
            >
              Game Phase {data.phaseNumber}
            </span>
          </div>
          <h2 className="text-xl font-bold mb-0.5" style={{ color: 'var(--color-text)' }}>
            {data.subtitle}
          </h2>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.7rem', color: data.accentColor, fontWeight: 600,
            letterSpacing: '0.05em', marginTop: '0.25rem',
          }}>
            <span style={{ opacity: 0.6 }}>Forensic Framework:</span>
            <span>{data.forensicPhases}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${data.accentBorder}, transparent)`, marginBottom: '1.25rem' }} />

        {/* Summary */}
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', lineHeight: 1.75, marginBottom: '1.5rem', textAlign: 'center' }}>
          {data.summary}
        </p>

        {/* Principles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {data.principles.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.65rem 0.85rem', borderRadius: 8,
                background: data.accentBg, border: `1px solid ${data.accentBorder}`,
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: data.accentColor, marginBottom: '0.2rem' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {p.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What to do checklist */}
        <div style={{
          background: '#080c14', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Your Objectives
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.whatToDo.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: data.accentBg, border: `1.5px solid ${data.accentBorder}`,
                  color: data.accentColor, fontSize: '0.6rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Reference */}
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          📚 {data.reference}
        </div>

        {/* Begin button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}
          onClick={onBegin}
        >
          Begin {data.subtitle} →
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, ChevronRight, Shield, AlertCircle } from 'lucide-react';
import { ACTIONS } from '../gameState';

const SLIDES = [
  {
    icon: '☁️',
    title: 'Incident Detected',
    content: (
      <>
        <p className="mb-3">
          <span className="text-amber-400 font-semibold">ALERT:</span> A rogue Virtual Machine
          (<code className="font-mono text-indigo-300">Rogue_Instance_01</code>) has been detected in your
          cloud environment. It has been exfiltrating sensitive corporate data.
        </p>
        <p>
          You are the <strong>First Responder</strong>. Your mission: preserve digital evidence before
          the <strong>auto-scaling system destroys the VM</strong> — taking all volatile data with it.
        </p>
      </>
    ),
  },
  {
    icon: '⚠️',
    title: 'The Cloud Forensics Challenge',
    content: (
      <>
        <p className="mb-3">Unlike physical crime scenes, cloud environments present unique obstacles:</p>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><span className="text-red-400 shrink-0">✗</span><span><strong>No hardware access</strong> — you cannot attach a write blocker or dump RAM bit-by-bit</span></li>
          <li className="flex gap-2"><span className="text-amber-400 shrink-0">!</span><span><strong>High volatility</strong> — the instance can be terminated at any moment by auto-scaling</span></li>
          <li className="flex gap-2"><span className="text-indigo-400 shrink-0">≡</span><span><strong>Data redundancy</strong> — evidence is replicated across regions; you must identify the authoritative copy</span></li>
        </ul>
      </>
    ),
  },
  {
    icon: '🎯',
    title: 'Your Investigation',
    content: (
      <>
        <p className="mb-3">Your investigation unfolds in <strong>3 Phases</strong>:</p>
        <div className="space-y-2 text-sm">
          <div className="flex gap-3 items-start p-2 rounded" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <span className="font-bold text-indigo-400">1</span>
            <span><strong>Triage & Volatility</strong> — Secure the VM and acquire volatile evidence before auto-scaling destroys it</span>
          </div>
          <div className="flex gap-3 items-start p-2 rounded" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <span className="font-bold text-indigo-400">2</span>
            <span><strong>Acquisition & Redundancy</strong> — Analyze storage metadata to identify the authoritative source of evidence</span>
          </div>
          <div className="flex gap-3 items-start p-2 rounded" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <span className="font-bold text-indigo-400">3</span>
            <span><strong>Log Analysis & Attribution</strong> — Trace malicious API tokens back to their original root credential</span>
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Every wrong action reduces your <strong>Admissibility Score</strong> — a measure of evidence integrity.
        </p>
      </>
    ),
  },
];

export default function TutorialModal({ dispatch }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < SLIDES.length - 1) {
      setStep(s => s + 1);
    } else {
      dispatch({ type: ACTIONS.SKIP_TUTORIAL });
    }
  };

  const skip = () => dispatch({ type: ACTIONS.SKIP_TUTORIAL });

  const slide = SLIDES[step];

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
              CloudTrace — Briefing
            </span>
          </div>
          <button onClick={skip} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
            <X size={14} /> Skip
          </button>
        </div>

        {/* Slide icon + title */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">{slide.icon}</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{slide.title}</h2>
        </div>

        {/* Content */}
        <div className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
          {slide.content}
        </div>

        {/* Step dots + button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === step ? 'var(--color-primary)' : 'var(--color-border-bright)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={next}>
            {step < SLIDES.length - 1 ? (
              <><span>Next</span><ChevronRight size={16} /></>
            ) : (
              <><span>Start Investigation</span><ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

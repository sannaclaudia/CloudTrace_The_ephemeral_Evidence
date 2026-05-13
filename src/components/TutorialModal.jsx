import { useState } from 'react';
import { X, ChevronRight, Shield, Database, Activity, Lock } from 'lucide-react';
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
      </>
    ),
  },
  {
    icon: '🖥️',
    title: 'Interface Overview',
    content: (
      <>
        <p className="mb-4">Get familiar with your digital forensics toolkit:</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded border border-gray-700 bg-gray-800 flex items-start gap-2">
            <Activity className="text-primary shrink-0" size={16} />
            <div>
              <strong className="block text-primary mb-1">Admissibility Score</strong>
              Start with 100 points. Every non-forensically sound action deducts points. If it drops too low, your evidence won't hold up in court!
            </div>
          </div>
          <div className="p-3 rounded border border-gray-700 bg-gray-800 flex items-start gap-2">
            <Lock className="text-secondary shrink-0" size={16} />
            <div>
              <strong className="block text-secondary mb-1">Evidence Locker</strong>
              Toggles a side-panel. Every action you take is permanently logged here to maintain Chain of Custody.
            </div>
          </div>
          <div className="p-3 rounded border border-gray-700 bg-gray-800 col-span-2 flex items-start gap-2">
            <Database className="text-green-500 shrink-0" size={16} />
            <div>
              <strong className="block text-green-500 mb-1">Action Modals & Timeline HUD</strong>
              Read carefully before clicking. Buttons correspond to terminal commands or AWS API calls. Watch for countdown timers.
            </div>
          </div>
        </div>
      </>
    ),
  }
];

export default function TutorialModal({ dispatch }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < SLIDES.length - 1) {
      setStep(s => s + 1);
    } else {
      dispatch({ type: ACTIONS.HIDE_HOW_TO_PLAY });
    }
  };

  const skip = () => dispatch({ type: ACTIONS.HIDE_HOW_TO_PLAY });

  const slide = SLIDES[step];

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '650px', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
              How to Play / Briefing
            </span>
          </div>
          <button onClick={skip} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
            <X size={14} /> Close
          </button>
        </div>

        {/* Slide icon + title */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">{slide.icon}</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{slide.title}</h2>
        </div>

        {/* Content */}
        <div className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)', lineHeight: '1.7', minHeight: '180px' }}>
          {slide.content}
        </div>

        {/* Step dots + button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === step ? 'var(--color-primary)' : 'var(--color-border-bright)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onClick={() => setStep(i)}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={next}>
            {step < SLIDES.length - 1 ? (
              <><span>Next Slide</span><ChevronRight size={16} /></>
            ) : (
              <><span>Done</span><ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

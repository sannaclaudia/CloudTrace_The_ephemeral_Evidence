import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';

const TOUR_STEPS = {
  PHASE1: [
    { target: 'score-hud', title: 'Admissibility Score', text: 'This is your HUD. Keep an eye on your Admissibility Score. Mistakes will lower it.', position: 'bottom' },
    { target: 'evidence-locker-btn', title: 'Evidence Locker', text: 'Every action you take is permanently logged here to maintain Chain of Custody. Check it to see your collected evidence.', position: 'bottom' },
    { target: 'vm-overview', title: 'Instance Status', text: 'This is the VM Overview. It shows the current state, active network sockets, and metadata of the Rogue Instance.', position: 'right' },
    { target: 'action-console', title: 'Responder Console', text: 'The Incident Responder Console. Choose your actions carefully. Remember: secure the network before capturing RAM!', position: 'bottom' },
  ],
  PHASE2: [
    { target: 'step2-intro', title: 'Replicated Storage', text: 'These are the replicated S3 buckets. You must identify the original Primary Copy based on the metadata.', position: 'bottom' },
    { target: 'bucket-grid', title: 'Forensic Metadata', text: 'Focus on Last Modified and Replication Timestamps. Primary buckets typically do not have a Replication Timestamp.', position: 'bottom' },
  ],
  PHASE3: [
    { target: 'cloudtrail-logs', title: 'Event Logs', text: 'Here are the CloudTrail logs. They record every API call made in the AWS account.', position: 'right' },
    { target: 'attack-chain', title: 'Kill Chain', text: 'Reconstruct the full attack chain by placing events in chronological order, from initial credential theft to data exfiltration.', position: 'left' },
    { target: 'attribution-panel', title: 'Attribution', text: 'Finally, identify the true Attacker IP, the original stolen AKIA credential, and the execution Role ARN to complete the investigation.', position: 'top' }
  ]
};

export default function GuidedTour({ phase, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const steps = TOUR_STEPS[phase];
  
  useEffect(() => {
    if (!steps || stepIndex >= steps.length) {
      onComplete();
      return;
    }

    const currentStep = steps[stepIndex];
    
    const updateRect = () => {
      const el = document.getElementById(currentStep.target);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    
    // Polling slightly to catch elements that render over time
    const interval = setInterval(updateRect, 100);
    window.addEventListener('resize', updateRect);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
    };
  }, [stepIndex, phase, steps, onComplete]);

  if (!steps || stepIndex >= steps.length) return null;

  const currentStep = steps[stepIndex];
  
  let popoverStyle = { 
    position: 'fixed', zIndex: 9999, width: 320, 
    background: 'var(--color-surface)', border: '1px solid var(--color-primary)', 
    borderRadius: '12px', padding: '1.25rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
    transition: 'all 0.3s ease' 
  };

  if (rect) {
    if (currentStep.position === 'bottom') {
      popoverStyle.top = rect.bottom + 16;
      popoverStyle.left = Math.max(16, rect.left + rect.width / 2 - 160);
    } else if (currentStep.position === 'top') {
      popoverStyle.bottom = window.innerHeight - rect.top + 16;
      popoverStyle.left = Math.max(16, rect.left + rect.width / 2 - 160);
    } else if (currentStep.position === 'right') {
      popoverStyle.top = Math.max(16, rect.top + rect.height / 2 - 100);
      popoverStyle.left = rect.right + 16;
    } else if (currentStep.position === 'left') {
      popoverStyle.top = Math.max(16, rect.top + rect.height / 2 - 100);
      popoverStyle.right = window.innerWidth - rect.left + 16;
    }
    
    // bounds check
    if (popoverStyle.left && typeof popoverStyle.left === 'number' && popoverStyle.left + 320 > window.innerWidth) popoverStyle.left = window.innerWidth - 336;
    if (popoverStyle.bottom && typeof popoverStyle.bottom === 'number' && popoverStyle.bottom + 200 > window.innerHeight) popoverStyle.bottom = window.innerHeight - 216;
  } else {
    popoverStyle.top = '50%';
    popoverStyle.left = '50%';
    popoverStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none', background: rect ? 'transparent' : 'rgba(0,0,0,0.6)' }}>
        {rect && (
          <div style={{
            position: 'absolute',
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(2,4,12,0.85), 0 0 20px 4px rgba(99,102,241,0.3) inset',
            borderRadius: '12px',
            border: '2px solid rgba(99,102,241,0.5)',
            transition: 'all 0.3s ease',
          }} />
        )}
      </div>

      <div style={popoverStyle}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--color-primary)' }}>
            <Sparkles size={16} /> {currentStep.title}
          </h3>
          <button className="text-gray-400 hover:text-white" onClick={onComplete}><X size={14}/></button>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{currentStep.text}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>Step {stepIndex + 1} of {steps.length}</span>
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setStepIndex(s => s + 1)}>
            {stepIndex === steps.length - 1 ? 'Finish Tour' : 'Next'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
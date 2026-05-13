import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const LOADING_STEPS = [
  "Initializing incident response tools...",
  "Securing network pathways...",
  "Mounting cloud evidence drives...",
  "Loading CloudTrail analytics engine...",
  "Establishing secure sandbox...",
  "Environment Ready."
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 15) + 5, 100);
        
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 600); // small delay at 100% to let the user see it finish
        } else {
          // update step text based on progress
          const stepIndex = Math.min(
            Math.floor((next / 100) * LOADING_STEPS.length),
            LOADING_STEPS.length - 1
          );
          setStep(stepIndex);
        }
        
        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#030712', // Very dark blue/black background
      padding: '2rem'
    }}>
      <div style={{ marginBottom: '2.5rem', opacity: 0.8 + (progress / 500) }}>
        <Shield size={56} style={{ color: '#4f46e5' }} />
      </div>
      
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex justify-between text-xs font-mono mb-2" style={{ color: '#94a3b8' }}>
          <span>{progress >= 100 ? "Ready." : LOADING_STEPS[step]}</span>
          <span style={{ color: '#818cf8', fontWeight: 'bold' }}>{progress}%</span>
        </div>
        
        <div style={{ height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: 'linear-gradient(90deg, #4338ca, #6366f1)',
            transition: 'width 0.25s ease-out',
            boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)'
          }} />
        </div>
      </div>
    </div>
  );
}

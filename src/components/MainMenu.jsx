import React, { useState } from 'react';
import { ACTIONS } from '../gameState';
import { Shield, Play, Save, Info, Settings, ArrowLeft } from 'lucide-react';

export default function MainMenu({ dispatch }) {
  let initialHasSave = false;
  const saved = localStorage.getItem('CloudTraceSaveState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.phase && parsed.phase !== 'MAIN_MENU') {
        initialHasSave = true;
      }
    } catch (e) {
      console.error("Failed to parse save game", e);
    }
  }

  const [hasSave] = useState(initialHasSave);
  const [setupMode, setSetupMode] = useState(false);
  const [gameMode, setGameMode] = useState('Guided');
  const [timerMode, setTimerMode] = useState('Story');

  const handleStartInvestigation = () => {
    dispatch({ type: ACTIONS.SET_DIFFICULTY, payload: { gameMode, timerMode } });
    dispatch({ type: ACTIONS.NEW_GAME, payload: { gameMode, timerMode } });
  };

  const handleContinue = () => {
    const saved = localStorage.getItem('CloudTraceSaveState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: ACTIONS.LOAD_STATE, payload: parsed });
      } catch (e) {
        console.error("Failed to load save game", e);
      }
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
      padding: '2rem'
    }}>
      
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '3rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', marginBottom: '1.5rem' }}>
          <Shield size={32} style={{ color: '#818cf8' }} />
        </div>
        
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#f8fafc', letterSpacing: '-0.025em' }}>
          CloudTrace
        </h1>
        <h2 className="text-xl mb-8" style={{ color: '#94a3b8' }}>
          The Ephemeral Evidence
        </h2>

        {!setupMode ? (
          <>
            <p className="text-sm mb-10" style={{ color: '#cbd5e1', lineHeight: 1.6, maxWidth: '450px', margin: '0 auto 2.5rem' }}>
              A forensic investigation simulator. You must navigate a compromised AWS environment to preserve, acquire, and analyze evidence while maintaining absolute chain of custody and data admissibility in court.
            </p>

            <div className="flex flex-col gap-4" style={{ maxWidth: '300px', margin: '0 auto' }}>
              {hasSave && (
                <button className="btn btn-primary" style={{ padding: '0.875rem' }} onClick={handleContinue}>
                  <Save size={18} /> Continue Investigation
                </button>
              )}

              <button className={`btn ${hasSave ? 'btn-ghost' : 'btn-primary'}`} style={{ padding: '0.875rem', borderColor: hasSave ? 'var(--color-border)' : undefined }} onClick={() => setSetupMode(true)}>
                <Play size={18} /> Start New Investigation
              </button>

              <button className="btn btn-ghost" style={{ padding: '0.875rem' }} onClick={() => dispatch({ type: ACTIONS.SHOW_HOW_TO_PLAY })}>
                <Info size={18} /> How to Play
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'left', maxWidth: '450px', margin: '0 auto' }}>
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: '#94a3b8' }}>Select Difficulty</h3>
              <div className="space-y-2">
                {['Guided', 'Challenge', 'Final Exam'].map(mode => (
                  <div 
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    style={{
                      padding: '0.75rem 1rem', border: `1px solid ${gameMode === mode ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px', cursor: 'pointer', background: gameMode === mode ? 'rgba(99,102,241,0.1)' : 'var(--color-bg)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <span className="font-semibold text-sm" style={{ color: gameMode === mode ? 'var(--color-primary)' : 'var(--color-text)' }}>{mode} Mode</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      {mode === 'Guided' ? 'Hints Enabled' : mode === 'Challenge' ? 'No Hints · 1.25x Score' : 'Hardcore · 1.5x Score'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: '#94a3b8' }}>Select Investigation Pacing</h3>
              <div className="space-y-2">
                {['Story', 'Relaxed', 'Fast Run'].map(mode => (
                  <div 
                    key={mode}
                    onClick={() => setTimerMode(mode)}
                    style={{
                      padding: '0.75rem 1rem', border: `1px solid ${timerMode === mode ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: '8px', cursor: 'pointer', background: timerMode === mode ? 'rgba(34,197,94,0.1)' : 'var(--color-bg)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <span className="font-semibold text-sm" style={{ color: timerMode === mode ? 'var(--color-success)' : 'var(--color-text)' }}>{mode}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      {mode === 'Story' ? 'No Time Limit' : mode === 'Relaxed' ? '45 Minutes' : '30 Minutes'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1 justify-center" onClick={() => setSetupMode(false)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary flex-1 justify-center" onClick={handleStartInvestigation}>
                <Settings size={16} /> Deploy Instance
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-12 text-xs" style={{ color: '#475569' }}>
          v1.1.0 &bull; Cloud Forensics & Incident Response
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Power, HardDrive, Wifi, WifiOff, Camera, AlertTriangle, Clock, Activity, Server, PauseCircle, Network, ShieldCheck } from 'lucide-react';
import { ACTIONS } from '../gameState';

// Reduced timer for master's level
const TIMER_SECONDS = 90;

export default function Phase1Triage({ state, dispatch, addToast }) {
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [wrongActionModal, setWrongActionModal] = useState(null);
  const [showSnapshotSuccess, setShowSnapshotSuccess] = useState(false);
  const [timerFired, setTimerFired] = useState(false);
  const [actionUsed, setActionUsed] = useState({ 
    pause: false, ebs: false, flowlogs: false, poweroff: false 
  });

  // countdown
  useEffect(() => {
    if (state.snapshotTaken || state.gameOver || timerFired) return;
    if (seconds <= 0) {
      if (!timerFired) {
        setTimerFired(true);
        dispatch({ type: ACTIONS.TIMER_EXPIRED });
      }
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, state.snapshotTaken, state.gameOver, timerFired, dispatch]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timerUrgent = seconds <= 30 && !state.snapshotTaken;
  const timerPct = (seconds / TIMER_SECONDS) * 100;
  const timerColor = seconds > 45 ? '#22c55e' : seconds > 20 ? '#f59e0b' : '#ef4444';

  const triggerWrongAction = (actionType, title, body, lesson, severity = 'warning') => {
    setWrongActionModal({ icon: '⚠️', title, body, lesson, severity });
    dispatch({ type: actionType });
  };

  const handlePowerOff = () => {
    setActionUsed(prev => ({ ...prev, poweroff: true }));
    triggerWrongAction(
      ACTIONS.POWER_OFF_VM,
      'Forensic Error: Volatile Data Destroyed',
      'Powering off the VM immediately erases all contents of its RAM — active processes, network connections, encryption keys, and in-memory attacker artifacts.',
      'Review the order of volatility. What must be captured or contained while the machine is still running?',
      'critical'
    );
  };

  const handlePause = () => {
    setActionUsed(prev => ({ ...prev, pause: true }));
    triggerWrongAction(
      ACTIONS.PAUSE_VM,
      'Forensic Error: Suspend State Corruption',
      'Suspending a VM via the hypervisor forces an ACPI sleep state. This alters CPU registers, can corrupt memory structures, and often triggers anti-forensic malware mechanisms designed to detect sleep states.',
      'Live memory acquisition should be performed on a running instance.'
    );
  };

  const handleEbsSnapshot = () => {
    setActionUsed(prev => ({ ...prev, ebs: true }));
    triggerWrongAction(
      ACTIONS.DISK_SNAPSHOT,
      'Forensic Error: Wrong Acquisition Target',
      'You initiated an EBS (Elastic Block Store) snapshot. This captures the non-volatile disk drive, NOT the RAM. Data exfiltration requires active processes and network sockets, which exist only in memory.',
      'A disk snapshot captures non-volatile storage. Live memory (RAM) is highly volatile and must be acquired using a Memory Snapshot API.'
    );
  };

  const handleFlowLogs = () => {
    setActionUsed(prev => ({ ...prev, flowlogs: true }));
    triggerWrongAction(
      ACTIONS.ENABLE_FLOW_LOGS,
      'Action Warning: Misplaced Priority',
      'Enabling VPC Flow Logs is excellent for post-incident network analysis, but it is passive. It does nothing to contain the threat or preserve volatile memory data.',
      'Prioritize active containment to stop exfiltration, then preserve volatile state.'
    );
  };

  const handleIsolate = () => {
    if (state.networkIsolated) return;
    dispatch({ type: ACTIONS.ISOLATE_NETWORK });
    addToast({ type: 'success', title: 'Network Isolated', message: 'VPC Security Group updated. All ingress/egress rules removed. Exfiltration channel closed.' });
  };

  const handleVerifyState = () => {
    if (state.stateVerified) return;
    dispatch({ type: ACTIONS.VERIFY_STATE });
    addToast({ type: 'success', title: 'State Verified', message: 'Confirmed API target state: RUNNING. Safe for memory acquisition.' });
  };

  const handleSnapshot = () => {
    if (!state.networkIsolated) {
      addToast({
        type: 'error',
        title: 'Prerequisite Not Met',
        message: 'You must isolate the network first to stop active data exfiltration before attempting a memory capture.',
      });
      return;
    }
    dispatch({ type: ACTIONS.TAKE_SNAPSHOT });
    setShowSnapshotSuccess(true);
  };

  const confirmSnapshotSuccess = () => {
    setShowSnapshotSuccess(false);
    dispatch({ type: ACTIONS.PHASE1_COMPLETE });
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold mb-0.5">Phase 1: Triage & Volatility</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Threat: Active Exfiltration. Secure the instance and acquire volatile data before auto-scaling termination.
          </p>
        </div>

        {/* Timer */}
        <div className={`text-right ${timerUrgent ? 'countdown-urgent' : ''}`}>
          <div className="flex items-center gap-2 justify-end mb-1">
            <Clock size={16} style={{ color: timerColor }} />
            <span className="font-mono text-2xl font-bold" style={{ color: timerColor }}>
              {formatTime(seconds)}
            </span>
          </div>
          <div className="progress-bar" style={{ width: 140 }}>
            <div className="progress-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>until auto-scale termination</div>
        </div>
      </div>

      {/* VM Status Card */}
      <div className="card mb-5" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="vm-scan-line" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.15)', borderRadius: 8 }}>
              <Server size={22} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Rogue_Instance_01</span>
                <span className="badge badge-danger">RUNNING</span>
                {state.networkIsolated && <span className="badge badge-warning">ISOLATED</span>}
              </div>
              <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                Instance ID: i-0a1b2c3d4e5f67890
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={14} style={{ color: '#ef4444' }} />
            <span className="text-xs font-mono" style={{ color: '#ef4444' }}>CPU 94%</span>
          </div>
        </div>

        {/* Active connections */}
        <div style={{ padding: '0.75rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
          <div className="text-xs mb-2 font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Network size={14} /> Active Network Sockets (ss/netstat map)
          </div>
          {state.networkIsolated ? (
            <div className="text-xs font-mono" style={{ color: '#22c55e' }}>[VPC ENI DETACHED] Network flows blocked.</div>
          ) : (
            <div className="space-y-1 font-mono text-xs" style={{ color: '#ef4444' }}>
              {['tcp  ESTAB  0  0  10.0.4.22:4444  185.220.101.47:59302  users:(("python3",pid=4812,fd=3))',
                'tcp  ESTAB  0  0  10.0.4.22:22    185.220.101.47:11933  users:(("sshd",pid=1120,fd=4))',
              ].map((c, i) => <div key={i}>{c}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* Response Actions (6 buttons, harder) */}
      <div className="card">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Cloud Incident Responder Console
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', opacity: actionUsed.pause ? 0.4 : 1 }}
            onClick={handlePause}
            disabled={actionUsed.pause}
          >
            <div className="flex items-center gap-2 mb-1">
              <PauseCircle size={16} /> <span className="font-semibold">Suspend VM</span>
            </div>
            <span className="text-xs text-left opacity-70">Pause compute hypervisor execution</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', opacity: 0.4, cursor: 'not-allowed' }}
            disabled
            data-tooltip="IMPOSSIBLE: Missing physical hardware access layer."
          >
            <div className="flex items-center gap-2 mb-1">
              <HardDrive size={16} /> <span className="font-semibold">Direct RAM Dump</span>
            </div>
            <span className="text-xs text-left opacity-70">Execute LiME kernel module via USB</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', opacity: actionUsed.ebs ? 0.4 : 1 }}
            onClick={handleEbsSnapshot}
            disabled={actionUsed.ebs}
          >
            <div className="flex items-center gap-2 mb-1">
              <HardDrive size={16} /> <span className="font-semibold">EBS Snapshot</span>
            </div>
            <span className="text-xs text-left opacity-70">Acquire block storage volumes</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', opacity: actionUsed.flowlogs ? 0.4 : 1 }}
            onClick={handleFlowLogs}
            disabled={actionUsed.flowlogs}
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} /> <span className="font-semibold">Enable Flow Logs</span>
            </div>
            <span className="text-xs text-left opacity-70">Start capturing VPC network metadata</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{ 
              justifyContent: 'flex-start', padding: '0.75rem 1rem', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', opacity: actionUsed.poweroff ? 0.4 : 1 
            }}
            onClick={handlePowerOff}
            disabled={actionUsed.poweroff}
          >
            <div className="flex items-center gap-2 mb-1">
              <Power size={16} /> <span className="font-semibold">Power Off (ACPI)</span>
            </div>
            <span className="text-xs text-left opacity-70">Send shutdown signal to OS</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              justifyContent: 'flex-start', padding: '0.75rem 1rem', flexDirection: 'column', alignItems: 'flex-start', height: 'auto',
              ...(state.networkIsolated ? {
                background: 'rgba(34,197,94,0.1)',
                borderColor: '#22c55e',
                color: '#86efac'
              } : {})
            }}
            onClick={handleIsolate}
            disabled={state.networkIsolated}
          >
            <div className="flex items-center gap-2 mb-1">
              {state.networkIsolated ? <WifiOff size={16} /> : <Wifi size={16} />}
              <span className="font-semibold">Isolate Network (SG)</span>
            </div>
            <span className="text-xs text-left opacity-70">Drop all VPC ingress/egress rules</span>
          </button>
        </div>

        {/* Sub-step verification and Snapshot appear only after isolation (keeps UI focused but challenging) */}
        {state.networkIsolated && (
          <div className="mt-4 p-4 rounded bg-gray-900" style={{ background: '#0a0d14', border: '1px solid var(--color-border)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Acquisition Sub-Routine Unlocked
            </div>
            <div className="flex gap-3">
              <button
                 className="btn"
                 style={{
                   flex: 1, height: 'auto', padding: '0.75rem', flexDirection: 'column', alignItems: 'flex-start',
                   background: state.stateVerified ? 'rgba(34,197,94,0.1)' : 'var(--color-surface-2)',
                   borderColor: state.stateVerified ? '#22c55e' : 'var(--color-border)'
                 }}
                 onClick={handleVerifyState}
                 disabled={state.stateVerified}
              >
                <div className="flex items-center gap-2 mb-1" style={{ color: state.stateVerified ? '#86efac' : 'var(--color-text)' }}>
                  <ShieldCheck size={16} /> <span className="font-semibold">Verify VM State</span>
                </div>
                <span className="text-xs text-left opacity-70" style={{ color: state.stateVerified ? '#86efac' : 'var(--color-text)' }}>
                  Confirm RUNNING state before API call
                </span>
              </button>
              
              <button
                 className="btn pulse-glow"
                 style={{
                   flex: 1, height: 'auto', padding: '0.75rem', flexDirection: 'column', alignItems: 'flex-start',
                   background: 'rgba(99,102,241,0.15)', borderColor: '#6366f1', color: '#a5b4fc',
                 }}
                 onClick={handleSnapshot}
                 disabled={state.snapshotTaken}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Camera size={16} /> <span className="font-semibold">API Memory Snapshot</span>
                </div>
                <span className="text-xs text-left opacity-70">
                  Execute CSP live RAM acquisition payload
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {wrongActionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="text-4xl text-center mb-3">{wrongActionModal.icon}</div>
            <h2 className="text-lg font-bold text-center mb-1" style={{ color: wrongActionModal.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
              {wrongActionModal.title}
            </h2>
            {wrongActionModal.severity === 'critical' && (
              <div className="text-center mb-4"><span className="badge badge-danger">CRITICAL VIOLATION</span></div>
            )}
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{wrongActionModal.body}</p>
            <div className="p-3 rounded mb-5 text-sm" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>✓ Correct Procedure:</strong>
              {wrongActionModal.lesson}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setWrongActionModal(null)}>
              Understood
            </button>
          </div>
        </div>
      )}

      {showSnapshotSuccess && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="text-5xl text-center mb-3">📸</div>
            <h2 className="text-lg font-bold text-center mb-2" style={{ color: '#22c55e' }}>
              RAM Snapshot Acquired
            </h2>
            <div className="space-y-2 mb-5 font-mono text-xs" style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '0.75rem' }}>
              <div style={{ color: '#86efac' }}>✓ Network verified isolated (SG modified)</div>
              {!state.stateVerified && (
                 <div style={{ color: '#ef4444' }}>⚠ State verification skipped. (−10 Admissibility)</div>
              )}
              {state.stateVerified && (
                 <div style={{ color: '#86efac' }}>✓ API target verified as RUNNING</div>
              )}
              <div style={{ color: '#86efac' }}>✓ CreateSnapshot API call successful</div>
              <div style={{ color: '#86efac' }}>✓ 32 GB logical memory block captured</div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Live volatile memory has been collected safely via the CSP API. You may now safely terminate the instance.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={confirmSnapshotSuccess}>
              Advance to Phase 2: S3 Evidence Triage →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

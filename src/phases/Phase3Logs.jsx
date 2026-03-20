import { useState, useMemo } from 'react';
import { Search, FileText, AlertTriangle, Send } from 'lucide-react';
import { ACTIONS } from '../gameState';
import logsData from '../data/cloudtrail_logs.json';

const EVENT_COLOR = {
  RunInstances:       '#ef4444',
  DeleteTrail:        '#ef4444',
  AssumeRole:         '#f59e0b',
  CreateSecurityGroup:'#f59e0b',
  PutObject:          '#f59e0b',
  ConsoleLogin:       '#94a3b8',
  ListBuckets:        '#94a3b8',
  DescribeInstances:  '#94a3b8',
  GetCallerIdentity:  '#94a3b8',
};

export default function Phase3Logs({ state, dispatch, addToast }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [submitIp, setSubmitIp] = useState('');
  const [submitKey, setSubmitKey] = useState('');
  const [submitRole, setSubmitRole] = useState('');
  const [wrongModal, setWrongModal] = useState(false);
  const [wrongMsg, setWrongMsg] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return logsData;
    return logsData.filter(log =>
      log.eventName.toLowerCase().includes(q) ||
      log.sourceIPAddress.toLowerCase().includes(q) ||
      (log.userIdentity.accessKeyId || '').toLowerCase().includes(q) ||
      (log.userIdentity.userName || '').toLowerCase().includes(q) ||
      (log.requestParameters?.roleArn || '').toLowerCase().includes(q)
    );
  }, [search]);

  const handleSubmit = () => {
    dispatch({ 
      type: ACTIONS.SUBMIT_INVESTIGATION, 
      payload: { ip: submitIp, apiKey: submitKey, roleArn: submitRole } 
    });
    
    // Check if right or wrong directly here to show the modal (reducer handles score)
    const ipC = submitIp.trim() === '185.220.101.47';
    const keyC = submitKey.trim() === 'AKIAIOSFODNN7DEV01A3';
    const roleC = submitRole.trim() === 'arn:aws:iam::123456789012:role/AutomationServiceRole';

    if (!ipC || !keyC || !roleC) {
      let err = 'Incorrect attribution parameters.';
      if (!ipC && submitIp.trim() === 'ec2.amazonaws.com') {
        err = 'Trap Triggered: The sourceIPAddress in the RunInstances event is an AWS internal endpoint (ec2.amazonaws.com). Why? Because a Role was assumed. You must trace the session context backwards to find the TRUE attacker IP.';
      } else if (!keyC && submitKey.trim().startsWith('ASIA')) {
        err = 'Trap Triggered: ASIA... indicates a temporary session token. The brief requires the permanent root credential (AKIA...) that initially requested this token.';
      } else if (!roleC) {
        err = 'The Required Assumed Role ARN is incorrect. Look for the final Execution Role ARN that invoked the RunInstances API.';
      }
      setWrongMsg(err);
      setWrongModal(true);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-0.5">Phase 3: Log Analysis & Attribution</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Trace the attack chain using AWS CloudTrail. Identify the <strong>RunInstances</strong> event, 
          but beware: advanced attackers use <strong>Role Assumption</strong> to mask their true origin. 
          Trace the session token back to the root compromised IAM credential and true source IP.
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        {/* Log viewer */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
          {/* Search header */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Search size={15} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
            <input
              className="input w-full"
              style={{ border: 'none', background: 'transparent', padding: 0 }}
              placeholder="Search by IP, Event Name, API Key, Role ARN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-dim)', flexShrink: 0 }}>
              {filtered.length}/{logsData.length} events
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px 140px 1fr 140px',
            padding: '0.4rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
          }}>
            {['Time (UTC)', 'Event', 'Source IP', 'Identity Type'].map(h => (
              <div key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>{h}</div>
            ))}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(log => {
              const isExpanded = expanded === log.id;
              const color = EVENT_COLOR[log.eventName] || '#94a3b8';
              
              // Only highlight if they explicitly search
              const isHighlighted = search && (
                log.sourceIPAddress === search || log.userIdentity.accessKeyId === search
              );

              return (
                <div key={log.id} className={`log-row ${isHighlighted ? 'highlighted' : ''}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '130px 140px 1fr 140px', padding: '0.6rem 1rem', cursor: 'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    <div className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {log.eventTime.split('T')[1].replace('Z', '')}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-xs font-medium" style={{ color }}>{log.eventName}</span>
                    </div>
                    <div className="font-mono text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {log.sourceIPAddress}
                    </div>
                    <div className="font-mono text-xs truncate" style={{ color: 'var(--color-text-dim)' }}>
                      {log.userIdentity.type}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 1rem 0.75rem', background: 'var(--color-bg)' }}>
                      <pre className="font-mono text-xs p-3 rounded overflow-auto" style={{
                        background: '#080b12', border: '1px solid var(--color-border)',
                        color: '#e0e7ff', maxHeight: 250,
                      }}>
                        {JSON.stringify(log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attribution panel */}
        <div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              <span className="font-semibold text-sm">Root Cause Attribution</span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Locate the attack. Do NOT submit intermediate pivot IPs or temporary session tokens. 
              Find the original IAM key and the true attacker IP that initiated the chain.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  True Attacker Source IP
                </label>
                <input
                  className="input"
                  placeholder="Not the AWS endpoint..."
                  value={submitIp}
                  onChange={e => setSubmitIp(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Execution Role ARN
                </label>
                <input
                  className="input font-mono text-xs"
                  placeholder="arn:aws:iam::..."
                  value={submitRole}
                  onChange={e => setSubmitRole(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Root Compromised IAM Key ID
                </label>
                <input
                  className="input font-mono text-xs"
                  placeholder="AKIA..."
                  value={submitKey}
                  onChange={e => setSubmitKey(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-primary mt-6 w-full justify-center"
              onClick={handleSubmit}
              disabled={!submitIp || !submitKey || !submitRole}
            >
              <Send size={14} /> Submit Final Report
            </button>

          </div>
        </div>
      </div>

      {wrongModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="text-4xl text-center mb-3">🔍</div>
            <h2 className="text-lg font-bold text-center mb-2" style={{ color: '#ef4444' }}>
              Forensic Attribution Failed
            </h2>
            <p className="text-sm mb-4 font-mono p-3 rounded" style={{ background: '#2a1215', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
              {wrongMsg}
            </p>
            <div className="p-3 rounded mb-4 text-sm" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#c7d2fe' }}>
              <strong>Analyst Guidance:</strong>
              <ul className="mt-2 space-y-2 text-xs opacity-90 list-disc pl-4">
                <li>A <code>RunInstances</code> call made via an IAM Role displays the AWS service endpoint as the IP, not the user.</li>
                <li>Temporary credentials start with <code>ASIA...</code>. Permanent IAM keys start with <code>AKIA...</code>.</li>
                <li>Look for an <code>AssumeRole</code> event preceding the attack. Match the <code>sessionToken</code> or <code>sessionIssuer</code> to map the chain backwards.</li>
              </ul>
            </div>
            <button className="btn btn-primary w-full" onClick={() => setWrongModal(false)}>
              Re-evaluate Timelines (−15 Admissibility)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

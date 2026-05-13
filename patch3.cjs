const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// 1. Hints
let newContent = content.replace(`
        {/* Guidance & Hints (Visible when requested) */}
        {hintsUsed > 0 && (
          <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={16} style={{ color: '#a5b4fc' }} />
              <span className="font-semibold" style={{ color: '#c7d2fe' }}>Investigation Guidance & Hints</span>
            </div>
            <ul className="space-y-2 list-disc list-inside" style={{ color: '#e0e7ff', lineHeight: 1.6 }}>
              {HINTS.slice(0, hintsUsed).map((hint, i) => (
                <li key={i}><span style={{ color: '#a5b4fc', fontWeight: 'bold' }}>Hint {i + 1}:</span> {hint}</li>
              ))}
            </ul>
          </div>
        )}`, '');

let hintsHtml = `
            {/* Guidance & Hints (Visible when requested) */}
            {hintsUsed > 0 && (
              <div className="p-3 mb-4 rounded-lg text-xs" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle size={14} style={{ color: '#a5b4fc' }} />
                  <span className="font-semibold" style={{ color: '#c7d2fe' }}>Investigation Hints</span>
                </div>
                <ul className="space-y-2 list-disc list-inside" style={{ color: '#e0e7ff', lineHeight: 1.5 }}>
                  {HINTS.slice(0, hintsUsed).map((hint, i) => (
                    <li key={i}><span style={{ color: '#a5b4fc', fontWeight: 'bold' }}>Hint {i + 1}:</span> {hint}</li>
                  ))}
                </ul>
              </div>
            )}`;

newContent = newContent.replace(`
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                <span className="font-semibold text-sm">Root Cause Attribution</span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', opacity: hintsUsed >= 3 ? 0.4 : 1 }}
                onClick={handleUseHint}
                disabled={hintsUsed >= 3}
                title={\`Use Hint — \${3 - hintsUsed} remaining (−5 each)\`}
              >
                Need Help?
              </button>
            </div>`, `
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                <span className="font-semibold text-sm">Root Cause Attribution</span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', opacity: hintsUsed >= 3 ? 0.4 : 1 }}
                onClick={handleUseHint}
                disabled={hintsUsed >= 3}
                title={\`Use Hint — \${3 - hintsUsed} remaining (−5 each)\`}
              >
                Need Help?
              </button>
            </div>
${hintsHtml}`);

// 2. Attack Chain inside left column
const logViewerToAntiForensicsRegex = /\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}\n      <div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>\n\n        \{\/\* Log viewer \*\/\}\n        <div className="card" style=\{\{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '560px' \}\}>([\s\S]*?)\n        \{\/\* Attribution panel & Anti-Forensics callout \*\/\}/;

const matchMain = newContent.match(logViewerToAntiForensicsRegex);
const attackChainMatch = newContent.match(/\{\/\* ── ATTACK CHAIN RECONSTRUCTION ── \*\/\}\n      <div className="card" style=\{\{ border: `1px solid \$\{state\.attackChainCompleted \? 'rgba\(34,197,94,0\.4\)' : 'rgba\(99,102,241,0\.4\)'\}` \}\}>[\s\S]*?\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}/);

if (matchMain && attackChainMatch) {
  // Extract Attack Chain content, leaving comments out
  const attackChainHtml = attackChainMatch[0].replace(/\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}/, "");
  
  // Remove Attack Chain from previous spot
  newContent = newContent.replace(attackChainHtml, "");
  
  // Insert it after Log viewer, in a Left column wrap
  const logViewerHtml = `        {/* Left Column */}\n        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>\n          {/* Log viewer */}\n          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '400px' }}>${matchMain[1]}\n          ${attackChainHtml}\n        </div>\n\n        {/* Attribution panel & Anti-Forensics callout */}`;
  
  // Replace the original log viewer with the wrapped one
  newContent = newContent.replace(matchMain[0], logViewerHtml);
  
  // Update the grid wrapper alignment
  newContent = newContent.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>/, "<div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>");

  fs.writeFileSync('src/phases/Phase3Logs.jsx', newContent);
  console.log("Patched successfully");
} else {
  console.log("Failed to match", !!matchMain, !!attackChainMatch);
}

const fs = require('fs');
const content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// 1. Remove the hints from the top
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

// 2. Add the hints to the Root Cause Attribution
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
            )}`);

// 3. Extract Attack Chain Reconstruction
const attackChainMatch = newContent.match(/\{\/\* ── ATTACK CHAIN RECONSTRUCTION ── \*\/\}\n([\s\S]*?)\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}\n      <div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px'/);
if (attackChainMatch) {
  const attackChainHtml = "{/* ── ATTACK CHAIN RECONSTRUCTION ── */}\n" + attackChainMatch[1];
  
  // Remove it from its current position
  newContent = newContent.replace(attackChainHtml, "");
  
  // Insert it after the Main 2-col layout
  const endOf2ColLayoutMatch = newContent.match(/\{\/\* Wrong submission modal \*\/\}/);
  if(endOf2ColLayoutMatch) {
    newContent = newContent.replace("{/* Wrong submission modal */}", attackChainHtml + "\n      {/* Wrong submission modal */}");
  }
}

fs.writeFileSync('src/phases/Phase3Logs.jsx', newContent);

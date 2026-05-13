const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// I need to add the hints back under "Root Cause Attribution" if it doesn't exist.
const attributionHeader = `<span className="font-semibold text-sm">Root Cause Attribution</span>`;

const hintsHtml = `
            {/* Guidance & Hints */}
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

if (!content.includes('Guidance & Hints')) {
  content = content.replace(/<\/button>\n\s*<\/div>\n\s*<div>\n\s*<label/g, "</button>\n            </div>\n" + hintsHtml + "\n            <div>\n              <label");
  fs.writeFileSync('src/phases/Phase3Logs.jsx', content);
  console.log('Fixed hints');
} else {
  console.log('Hints already in file');
}


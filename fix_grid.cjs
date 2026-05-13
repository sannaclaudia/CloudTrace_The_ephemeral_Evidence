const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// The layout right now is:
// <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem' }}>
//   {/* Log viewer */} ... </div>
//   {/* ── ATTACK CHAIN RECONSTRUCTION ── */} ... </div>
//   {/* Attribution panel & Anti-Forensics callout */} ... </div>
// </div>

const gridStart = `{/* Main 2-col layout: log viewer + attribution */}\n      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem' }}>`;

const newGridStart = `{/* Main 2-col layout: log viewer + attribution */}\n      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>\n\n        {/* Left Column: Log Viewer + Attack Chain */}\n        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>`;

content = content.replace(gridStart, newGridStart);

const antiForensicsStart = `{/* Attribution panel & Anti-Forensics callout */}`;

// Before the attribution panel, we need to close the left column
content = content.replace("        {/* Attribution panel & Anti-Forensics callout */}", "        </div>\n\n        {/* Attribution panel & Anti-Forensics callout */}");

// Also, the log viewer has a hardcoded height of 560px. That may cause empty space. Let's make it more flexible or keep it.
// Actually, let's remove the fixed height of 560px from the log viewer, maybe just set a max-height or height: 400px.
content = content.replace("height: '560px'", "height: '450px'");

fs.writeFileSync('src/phases/Phase3Logs.jsx', content);


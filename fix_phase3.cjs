const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// 1. Move ATTACK CHAIN RECONSTRUCTION inside the left column of the 2-col layout
const attackChainRegex = /\{\/\* ── ATTACK CHAIN RECONSTRUCTION ── \*\/\}[\s\S]*?(?=\{\/\* Main 2-col layout: log viewer \+ attribution \*\/})/g;
const attackChainMatch = content.match(attackChainRegex);

if (attackChainMatch) {
  content = content.replace(attackChainMatch[0], '');
  
  const layoutStart = /\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}\n      <div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>\n\n        \{\/\* Log viewer \*\/\}/;
  content = content.replace(layoutStart, `{/* Main 2-col layout: log viewer + attribution */}\n      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>\n\n        {/* Left Column */}\n        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>\n\n        {/* Log viewer */}`);
  
  // Find where log viewer ends
  const logViewerEnd = /(?=        \{\/\* Attribution panel & Anti-Forensics callout \*\/\}|        \{\/\* Attribution Form \*\/})/;
  content = content.replace(logViewerEnd, attackChainMatch[0] + "\n        </div>\n\n");
}

fs.writeFileSync('src/phases/Phase3Logs.jsx', content);
console.log("Phase3Logs updated");

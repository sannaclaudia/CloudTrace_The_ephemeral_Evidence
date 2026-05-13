const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// The layout right now is:
// <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem' }}>
//   <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '560px' }}>...</div>
//   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>...</div>
// </div>
// {/* ── ATTACK CHAIN RECONSTRUCTION ── */}
// <div className="card" style={{ border: ... }}>...</div>

// We need to wrap the Log viewer AND Attack Chain Reconstruction in a left column div
// so the layout becomes:
// <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
//   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
//     <Log viewer>
//     <Attack Chain Reconstruction>
//   </div>
//   <Attribution panel>
// </div>

const matchMainLayout = content.match(/\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}\n      <div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>\n\n        \{\/\* Log viewer \*\/\}\n        <div className="card" style=\{\{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '560px' \}\}>([\s\S]*?)        \{\/\* Attribution panel & Anti-Forensics callout \*\/\}/);

const attackChainMatch = content.match(/\{\/\* ── ATTACK CHAIN RECONSTRUCTION ── \*\/\}\n      <div className="card" style=\{\{ border:[\s\S]*?\{\/\* Wrong submission modal \*\/\}/);

if (matchMainLayout && attackChainMatch) {
  const logViewerHtml = `        {/* Left Column */}\n        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>\n          {/* Log viewer */}\n          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '400px' }}>${matchMainLayout[1]}`;
  
  const attackChainContent = attackChainMatch[0].replace(/\{\/\* Wrong submission modal \*\/\}/, "");
  
  let newContent = content.replace(matchMainLayout[0], logViewerHtml + "\n" + attackChainContent + "        </div>\n\n        {/* Attribution panel & Anti-Forensics callout */}");
  
  newContent = newContent.replace(attackChainMatch[0], "{/* Wrong submission modal */}");
  // Also adjust the display grid slightly to ensure the layout starts at the top
  newContent = newContent.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>/, "<div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>");

  fs.writeFileSync('src/phases/Phase3Logs.jsx', newContent);
  console.log("Success");
} else {
  console.log("Match failed", !!matchMainLayout, !!attackChainMatch);
}


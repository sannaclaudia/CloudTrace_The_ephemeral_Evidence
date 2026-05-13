const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

const mainLayoutMatch = content.match(/\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}\n      <div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1\.5rem', marginBottom: '1\.5rem' \}\}>\n\n        \{\/\* Log viewer \*\/\}\n        <div className="card" style=\{\{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '560px' \}\}>/);

const attackChainMatch = content.match(/\{\/\* ── ATTACK CHAIN RECONSTRUCTION ── \*\/\}\n      <div className="card" style=\{\{ border: `1px solid \$\{state\.attackChainCompleted \? 'rgba\(34,197,94,0\.4\)' : 'rgba\(99,102,241,0\.4\)'\}` \}\}>[\s\S]*?\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}/);


if (attackChainMatch) {
  let attackChainString = attackChainMatch[0].replace(/\{\/\* Main 2-col layout: log viewer \+ attribution \*\/\}/, "");
  
  // Remove Attack Chain from previous position
  content = content.replace(attackChainString, "");

  // Insert it after the log table 
  const afterLogTable = content.match(/<\/div>\n\n        \{\/\* Attribution panel & Anti-Forensics callout \*\/\}/);
  if (afterLogTable) {
    content = content.replace(afterLogTable[0], "</div>\n        " + attackChainString + "\n        {/* Attribution panel & Anti-Forensics callout */}");
    fs.writeFileSync('src/phases/Phase3Logs.jsx', content);
    console.log("Layout fixed");
  } else {
    console.log("Could not find afterLogTable");
  }
} else {
  console.log("Could not find attackChainMatch");
}


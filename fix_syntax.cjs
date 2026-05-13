const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

// I need to add the grid div BEFORE {/* Left Column */}
const badLeftColumnStart = "        {/* Left Column */}\n        <div style={{ display: 'flex',";
const goodLeftColumnStart = `{/* Main 2-col layout: log viewer + attribution */}\n      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>\n\n` + badLeftColumnStart;

content = content.replace(badLeftColumnStart, goodLeftColumnStart);
fs.writeFileSync('src/phases/Phase3Logs.jsx', content);

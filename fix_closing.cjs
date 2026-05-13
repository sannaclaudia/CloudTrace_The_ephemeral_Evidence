const fs = require('fs');
let content = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines around 485:');
for (let i = 480; i < 495; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

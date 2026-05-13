const babel = require('@babel/parser');
const fs = require('fs');

const code = fs.readFileSync('src/phases/Phase3Logs.jsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log("No syntax errors found by Babel.");
} catch (e) {
  console.log("Babel Parse Error:", e.message, "at line", e.loc.line, "column", e.loc.column);
}

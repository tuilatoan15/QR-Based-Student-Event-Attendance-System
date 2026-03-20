const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p, cb);
    } else if (p.endsWith('.dart')) {
      cb(p);
    }
  });
}

walk('lib', p => {
  let content = fs.readFileSync(p, 'utf8');
  let orig = content;
  
  // Split into lines
  let lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Theme.of(context)')) {
      // remove const on the exact same line that precedes a capital letter (e.g. const Text( -> Text()
      lines[i] = lines[i].replace(/const\s+([A-Z]\w*)/g, '$1');
      lines[i] = lines[i].replace(/const\s+\[/g, '[');
      
      // look back up to 6 lines for a hanging `const` that applies to this widget block
      for (let j = 1; j <= 6 && i-j >= 0; j++) {
        // if this previous line contains `const `, remove it
        if (/const\s+([A-Z]\w*)/.test(lines[i-j])) {
          lines[i-j] = lines[i-j].replace(/const\s+([A-Z]\w*)/g, '$1');
        }
        if (/const\s+\[/.test(lines[i-j])) {
          lines[i-j] = lines[i-j].replace(/const\s+\[/g, '[');
        }
      }
    }
  }
  
  content = lines.join('\n');
  if (content !== orig) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed', p);
  }
});

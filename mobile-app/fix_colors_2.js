const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.dart')) {
      callback(p);
    }
  });
}

const libDir = path.join(__dirname, 'lib');

walk(libDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace text colors
  content = content.replace(/color:\s*const\s*Color\(0xFF0F172A\)/g, 'color: Theme.of(context).textTheme.bodyLarge?.color');
  content = content.replace(/color:\s*Color\(0xFF0F172A\)/g, 'color: Theme.of(context).textTheme.bodyLarge?.color');
  content = content.replace(/color:\s*const\s*Color\(0xFF64748B\)/g, 'color: Theme.of(context).textTheme.bodyMedium?.color');
  content = content.replace(/color:\s*Color\(0xFF64748B\)/g, 'color: Theme.of(context).textTheme.bodyMedium?.color');
  content = content.replace(/color:\s*const\s*Color\(0xFF94A3B8\)/g, 'color: Theme.of(context).textTheme.bodySmall?.color');
  content = content.replace(/color:\s*Color\(0xFF94A3B8\)/g, 'color: Theme.of(context).textTheme.bodySmall?.color');
  content = content.replace(/color:\s*Colors\.black87/g, 'color: Theme.of(context).textTheme.bodyLarge?.color');
  content = content.replace(/color:\s*Colors\.black54/g, 'color: Theme.of(context).textTheme.bodyMedium?.color');
  content = content.replace(/color:\s*Colors\.black/g, 'color: Theme.of(context).textTheme.bodyLarge?.color');

  // Box Backgrounds
  // color: Colors.white
  content = content.replace(/color:\s*Colors\.white,\s*\n\s*borderRadius/g, 'color: Theme.of(context).colorScheme.surface,\nborderRadius');
  content = content.replace(/color:\s*Colors\.white\s*\)/g, 'color: Theme.of(context).colorScheme.surface)');
  content = content.replace(/BoxDecoration\(\s*color:\s*Colors\.white/g, 'BoxDecoration(color: Theme.of(context).colorScheme.surface');
  
  // Scaffold/AppBar/BottomNav backgrounds
  content = content.replace(/backgroundColor:\s*Colors\.white/g, 'backgroundColor: Theme.of(context).colorScheme.surface');
  content = content.replace(/surfaceTintColor:\s*Colors\.white/g, 'surfaceTintColor: Theme.of(context).colorScheme.surface');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
  }
});

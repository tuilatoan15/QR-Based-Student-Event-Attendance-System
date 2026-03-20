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

const libDir = path.join('c:', 'Users', 'ASUS', 'Desktop', 'QR-Based-Student-Event-Attendance-System', 'mobile-app', 'lib');

walk(libDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Remove F0F4FF background completely (so it defaults to Theme scaffoldBackground)
  content = content.replace(/backgroundColor:\s*const\s*Color\(0xFFF0F4FF\),/g, '');
  content = content.replace(/color:\s*const\s*Color\(0xFFF0F4FF\),/g, 'color: Theme.of(context).scaffoldBackgroundColor,');
  
  // 2. White backgrounds in typical UI elements
  // BottomNav color
  content = content.replace(/color:\s*Colors\.white,\n\s*boxShadow/g, 'color: Theme.of(context).colorScheme.surface,\n          boxShadow');
  content = content.replace(/backgroundColor:\s*Colors\.white,\n\s*selectedItemColor/g, 'backgroundColor: Theme.of(context).colorScheme.surface,\n          selectedItemColor');
  
  // Search bar background
  content = content.replace(/decoration:\s*BoxDecoration\(\n\s*color:\s*Colors\.white,/g, 'decoration: BoxDecoration(\n                          color: Theme.of(context).colorScheme.surface,');
  
  // Empty state bubble
  content = content.replace(/color:\s*const\s*Color\(0xFFEFF6FF\)/g, 'color: const Color(0xFF2563EB).withOpacity(0.1)');

  // App bars hardcoded styles
  // Just rely on theme for AppBar

  // Write if modified
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
  }
});

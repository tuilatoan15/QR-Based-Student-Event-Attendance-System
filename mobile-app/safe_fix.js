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
  
  // 1. Scaffold Backgrounds
  content = content.replace(/backgroundColor:\s*const\s*Color\(0xFFF0F4FF\),/g, ''); 
  content = content.replace(/backgroundColor:\s*Color\(0xFFF0F4FF\),/g, ''); 

  // 2. White backgrounds on Cards / Containers 
  // We remove any preceding `const ` from BoxDecoration if we add Theme.of
  content = content.replace(/(?:const\s+)?BoxDecoration\(\s*color:\s*Colors\.white/g, 'BoxDecoration(color: Theme.of(context).colorScheme.surface');
  // Bottom UI Bars
  content = content.replace(/color:\s*Colors\.white,\s*\n\s*boxShadow:\s*\[\s*(?:const\s+)?BoxShadow/g, 'color: Theme.of(context).colorScheme.surface,\nboxShadow: [BoxShadow');
  
  // 3. TextStyles - replace hardcoded dark text with body text colors and strip preceding `const `
  content = content.replace(/(?:const\s+)?TextStyle\(([^)]*?)color:\s*(?:const\s*)?Color\(0xFF0F172A\)([^)]*)\)/g, 'TextStyle($1color: Theme.of(context).textTheme.bodyLarge?.color$2)');
  content = content.replace(/(?:const\s+)?TextStyle\(([^)]*?)color:\s*(?:const\s*)?Color\(0xFF64748B\)([^)]*)\)/g, 'TextStyle($1color: Theme.of(context).textTheme.bodyMedium?.color$2)');
  content = content.replace(/(?:const\s+)?TextStyle\(([^)]*?)color:\s*(?:const\s*)?Color\(0xFF94A3B8\)([^)]*)\)/g, 'TextStyle($1color: Theme.of(context).textTheme.bodySmall?.color$2)');

  // 4. Texts - remove const from 'Text' if the style contains Theme.of. E.g. const Text(..., style: TextStyle(...Theme...)) 
  // We can do this safely by looking for `const Text(` and replacing it with `Text(` if the inner block has Theme.of
  // Or just globally strip `const ` before `Text(` if that line/block contains TextStyle and we just modified it.
  content = content.replace(/const\s+Text\(/g, 'Text(');
  // Also strip `const ` from `Padding` if it contains Text
  content = content.replace(/const\s+Padding\(/g, 'Padding(');
  content = content.replace(/const\s+Column\(/g, 'Column(');
  content = content.replace(/const\s+Row\(/g, 'Row(');
  content = content.replace(/const\s+Center\(/g, 'Center(');
  content = content.replace(/const\s+SizedBox\(/g, 'SizedBox(');
  
  // Specifically for Profile Divider
  content = content.replace(/(?:const\s+)?Divider\(height:\s*1,\s*color:\s*(?:const\s*)?Color\(0xFFF1F5F9\)\)/g, 'Divider(height: 1, color: Theme.of(context).dividerColor.withOpacity(0.1))');
  
  // Specifically for icon background in Profile
  content = content.replace(/(?:const\s+)?BoxDecoration\(\s*color:\s*(?:const\s*)?Color\(0xFFF0F9FF\)/g, 'BoxDecoration(color: Theme.of(context).colorScheme.primary.withOpacity(0.15)');

  // Specifically for profile avatar background
  content = content.replace(/backgroundColor:\s*(?:const\s*)?Color\(0xFFF1F5F9\)/g, 'backgroundColor: Theme.of(context).colorScheme.surfaceVariant');

  if (content !== orig) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed safe:', p);
  }
});

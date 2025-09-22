const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'frontend/src/components/ai/NarrativeEditor.tsx',
  'frontend/src/components/analytics/AnalyticsDashboard.tsx',
  'frontend/src/components/portfolio/AIPortfolioBuilder.tsx',
  'frontend/src/pages/AIPortfolioPage.tsx'
];

// Common unused imports to remove
const unusedImports = [
  'Sparkles', 'Calendar', 'PieChart', 'Activity', 'Edit3', 'Download', 
  'Share2', 'Plus', 'Trash2', 'Copy', 'RefreshCw', 'Settings', 'Play', 
  'Pause', 'RotateCcw', 'CheckCircle', 'AlertCircle', 'Loader2', 'Award'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove unused imports
    unusedImports.forEach(importName => {
      const regex = new RegExp(`\\s*${importName},?\\s*`, 'g');
      content = content.replace(regex, '');
    });
    
    // Clean up empty import lines
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n/g, '');
    
    // Clean up trailing commas in imports
    content = content.replace(/,\s*}/g, '}');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed imports in ${filePath}`);
  }
});

console.log('Import fixes completed!');

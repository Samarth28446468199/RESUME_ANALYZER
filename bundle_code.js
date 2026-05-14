const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', 'build', 'dist', 'uploads'];
const IGNORE_FILES = ['package-lock.json', 'all_code_for_claude.md', 'bundle_code.js', '.env'];
const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.css', '.html', '.json', '.md'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (IGNORE_DIRS.includes(file)) return;
        
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            const ext = path.extname(file);
            if (ALLOWED_EXTENSIONS.includes(ext) && !IGNORE_FILES.includes(file)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

const rootDir = __dirname;
const allFiles = getAllFiles(rootDir);
let combinedCode = '# AI Skill Gap Detector & Resume Analyzer Codebase\n\n';

allFiles.forEach(file => {
    const relativePath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const ext = path.extname(file).substring(1);
    
    combinedCode += `## File: ${relativePath}\n`;
    combinedCode += '```' + (ext === 'js' || ext === 'jsx' ? 'javascript' : ext) + '\n';
    combinedCode += content + '\n';
    combinedCode += '```\n\n';
});

fs.writeFileSync(path.join(rootDir, 'all_code_for_claude.md'), combinedCode);
console.log(`Successfully bundled ${allFiles.length} files into all_code_for_claude.md`);

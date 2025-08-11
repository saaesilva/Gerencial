const fs = require('fs');
const path = require('path');

function findFiles(dir, exts, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, exts, files);
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

function extractFunctions(content) {
  const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?}/g;
  return content.match(functionRegex) || [];
}

const projectDir = __dirname;
const exts = ['.js', '.ts'];
const files = findFiles(projectDir, exts);

let allFunctions = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const functions = extractFunctions(content);
  if (functions.length > 0) {
    allFunctions.push(`// ${file}\n` + functions.join('\n\n'));
  }
});

fs.writeFileSync('allFunctions.txt', allFunctions.join('\n\n'), 'utf8');
console.log('Funções extraídas para allFunctions.txt');const fs = require('fs');
const path = require('path');

function findFiles(dir, exts, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, exts, files);
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

function extractFunctions(content) {
  const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?}/g;
  return content.match(functionRegex) || [];
}

const projectDir = __dirname;
const exts = ['.js', '.ts'];
const files = findFiles(projectDir, exts);

let allFunctions = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const functions = extractFunctions(content);
  if (functions.length > 0) {
    allFunctions.push(`// ${file}\n` + functions.join('\n\n'));
  }
});

fs.writeFileSync('allFunctions.txt', allFunctions.join('\n\n'), 'utf8');
console.log('Funções extraídas para allFunctions.txt');
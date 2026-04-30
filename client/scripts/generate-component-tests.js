import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, '../src/components');
const testsDir = path.join(__dirname, '../src/components/__tests__');

if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
}

function generateTests(dir, targetDir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file === '__tests__') return;
      const subTargetDir = path.join(targetDir, file);
      if (!fs.existsSync(subTargetDir)) fs.mkdirSync(subTargetDir, { recursive: true });
      generateTests(filePath, subTargetDir);
    } else if (file.endsWith('.jsx')) {
      const testFileName = file.replace('.jsx', '.test.jsx');
      const testFilePath = path.join(targetDir, testFileName);

      if (!fs.existsSync(testFilePath)) {
        const componentName = file.replace('.jsx', '');
        const relativePath = path.relative(targetDir, filePath).replace(/\\/g, '/');
        
        const testUtilsPath = path.relative(path.dirname(testFilePath), path.join(__dirname, '../src/utils/test-utils')).replace(/\\/g, '/');
        
        const template = `import { render, screen } from '${testUtilsPath}';
import ${componentName} from '${relativePath.replace('.jsx', '')}';
import { describe, it, expect, vi } from 'vitest';

describe('${componentName} Component', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
  });
});
`;
        fs.writeFileSync(testFilePath, template);
        console.log(`Generated: ${testFilePath}`);
      }
    }
  });
}

generateTests(componentsDir, testsDir);
console.log('Component test generation complete.');

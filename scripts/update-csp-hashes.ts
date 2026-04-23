import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const indexHtmlPath = path.join(rootDir, 'index.html');
const vercelConfigPath = path.join(rootDir, 'vercel.json');

const indexHtml = readFileSync(indexHtmlPath, 'utf8');
const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8')) as {
  headers?: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
};

const inlineScripts = [...indexHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((content) => content.trim().length > 0);

const hashes = inlineScripts.map((content) => {
  const hash = createHash('sha256').update(content).digest('base64');
  return `'sha256-${hash}'`;
});

const cspHeader = vercelConfig.headers
  ?.flatMap((header) => header.headers)
  .find((header) => header.key === 'Content-Security-Policy');

if (!cspHeader) {
  throw new Error('Content-Security-Policy header not found in vercel.json');
}

const scriptSrcMatch = cspHeader.value.match(/script-src\s+([^;]+);/);
if (!scriptSrcMatch) {
  throw new Error('script-src directive not found in CSP header');
}

const scriptSrcParts = scriptSrcMatch[1]
  .split(/\s+/)
  .filter(Boolean)
  .filter((part) => !part.startsWith("'sha256-"));

const updatedScriptSrc = `script-src ${[...scriptSrcParts, ...hashes].join(' ')};`;
cspHeader.value = cspHeader.value.replace(/script-src\s+[^;]+;/, updatedScriptSrc);

writeFileSync(vercelConfigPath, `${JSON.stringify(vercelConfig, null, 2)}\n`);

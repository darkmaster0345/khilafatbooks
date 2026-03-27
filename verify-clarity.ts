const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const vercelJson = fs.readFileSync('vercel.json', 'utf8');

const clarityId = 'w2cz1tr7pz';
const hasClarity = indexHtml.includes(clarityId);
const hasCspScript = vercelJson.includes('https://www.clarity.ms');
const hasCspConnect = vercelJson.includes('https://*.clarity.ms');

if (hasClarity && hasCspScript && hasCspConnect) {
  console.log('SUCCESS: Clarity script and CSP configuration found.');
  process.exit(0);
} else {
  console.error('FAILURE: Missing configurations.');
  console.log('hasClarity:', hasClarity);
  console.log('hasCspScript:', hasCspScript);
  console.log('hasCspConnect:', hasCspConnect);
  process.exit(1);
}

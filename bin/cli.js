#!/usr/bin/env node
const { auditTarget } = require('../src/auditor');
const { startMcp } = require('../src/mcp');

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'mcp') {
  startMcp();
} else if (cmd === 'audit' && arg) {
  auditTarget(arg).then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e.message); process.exit(1); });
} else {
  console.log('Usage:\n  mcp-web-doctor audit <url-or-html-file>\n  mcp-web-doctor mcp');
}

const readline = require('readline');
const { auditTarget, auditCss } = require('./auditor');

function startMcp() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const send = obj => process.stdout.write(JSON.stringify(obj) + '\n');

  rl.on('line', async line => {
    if (!line.trim()) return;
    let req;
    try { req = JSON.parse(line); } catch { return; }

    if (req.method === 'initialize') {
      return send({ jsonrpc: '2.0', id: req.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'mcp-web-doctor', version: '1.0.0' } } });
    }
    if (req.method === 'tools/list') {
      return send({
        jsonrpc: '2.0', id: req.id,
        result: {
          tools: [
            { name: 'audit_webpage', description: 'Audit a local HTML file or live URL for SEO, H1s, canonicals, render-blocking scripts, and accessibility.', inputSchema: { type: 'object', properties: { target: { type: 'string' } }, required: ['target'] } },
            { name: 'audit_css', description: 'Analyze raw CSS for duplicate selectors and !important overuse.', inputSchema: { type: 'object', properties: { css: { type: 'string' } }, required: ['css'] } }
          ]
        }
      });
    }
    if (req.method === 'tools/call') {
      const { name, arguments: args = {} } = req.params || {};
      try {
        if (name === 'audit_webpage') {
          const out = await auditTarget(args.target);
          return send({ jsonrpc: '2.0', id: req.id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } });
        }
        if (name === 'audit_css') {
          const out = auditCss(args.css || '');
          return send({ jsonrpc: '2.0', id: req.id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } });
        }
      } catch (e) {
        return send({ jsonrpc: '2.0', id: req.id, error: { code: -32000, message: e.message } });
      }
    }
    if (req.id !== undefined) send({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'Method not found' } });
  });
}

module.exports = { startMcp };

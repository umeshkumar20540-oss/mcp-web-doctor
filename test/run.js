const assert = require('assert');
const { auditHtml, auditCss } = require('../src/auditor');

const badHtml = '<html><head><title>Hi</title></head><body><img src="a.png"><script src="app.js"></script></body></html>';
const res = auditHtml(badHtml, 'test.html');
assert(res.issues.some(i => i.rule === 'missing-meta-description'), 'Should flag missing meta description');
assert(res.issues.some(i => i.rule === 'missing-canonical'), 'Should flag missing canonical');
assert(res.issues.some(i => i.rule === 'missing-h1'), 'Should flag missing h1');
assert(res.issues.some(i => i.rule === 'img-missing-alt'), 'Should flag missing alt');
assert(res.issues.some(i => i.rule === 'render-blocking-js'), 'Should flag render-blocking script');

const cssRes = auditCss('.a{color:red!important}.a{color:blue}');
assert.strictEqual(cssRes.duplicateSelectors, 1);
assert.strictEqual(cssRes.importantCount, 1);
console.log('ALL mcp-web-doctor TESTS PASSED!');

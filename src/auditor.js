const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const mod = targetUrl.startsWith('https:') ? https : http;
    mod.get(targetUrl, { headers: { 'User-Agent': 'mcp-web-doctor/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(new URL(res.headers.location, targetUrl).href));
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, html: body }));
    }).on('error', reject);
  });
}

function auditHtml(html, source = 'inline') {
  const issues = [];
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : '';
  if (!title) issues.push({ severity: 'high', rule: 'missing-title', msg: 'Missing <title> tag' });
  else if (title.length > 65) issues.push({ severity: 'low', rule: 'long-title', msg: `Title is ${title.length} chars (Google truncates >60-65)` });

  const descM = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
  if (!descM) issues.push({ severity: 'high', rule: 'missing-meta-description', msg: 'Missing <meta name="description">' });

  if (!/<link\s+[^>]*rel=["']canonical["']/i.test(html)) {
    issues.push({ severity: 'medium', rule: 'missing-canonical', msg: 'Missing <link rel="canonical">' });
  }

  const h1Count = (html.match(/<h1(\s|>)/gi) || []).length;
  if (h1Count === 0) issues.push({ severity: 'high', rule: 'missing-h1', msg: 'No <h1> heading found' });
  else if (h1Count > 1) issues.push({ severity: 'medium', rule: 'multiple-h1', msg: `Found ${h1Count} <h1> tags (recommended: 1)` });

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const missingAlt = imgs.filter(tag => !/\balt=/i.test(tag)).length;
  if (missingAlt > 0) issues.push({ severity: 'medium', rule: 'img-missing-alt', msg: `${missingAlt} <img> tag(s) missing alt attribute` });

  const noLazy = imgs.filter(tag => !/\bloading=["']lazy["']/i.test(tag)).length;
  if (imgs.length > 3 && noLazy > 2) issues.push({ severity: 'low', rule: 'img-lazy-loading', msg: `${noLazy} images lack loading="lazy"` });

  const blockingScripts = [...html.matchAll(/<script\b[^>]*src=[^>]*>/gi)].filter(m => !/\b(defer|async|type=["']module["'])/i.test(m[0])).length;
  if (blockingScripts > 0) issues.push({ severity: 'medium', rule: 'render-blocking-js', msg: `${blockingScripts} render-blocking <script src> without defer/async` });

  const score = Math.max(0, 100 - issues.reduce((s, i) => s + (i.severity === 'high' ? 20 : i.severity === 'medium' ? 10 : 4), 0));
  return { source, score, title, h1Count, imageCount: imgs.length, issueCount: issues.length, issues };
}

function auditCss(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const importantCount = (clean.match(/!important/gi) || []).length;
  const rules = [...clean.matchAll(/([^{}@]+)\{([^{}]+)\}/g)];
  const selectors = new Map();
  let duplicateSelectors = 0;
  for (const r of rules) {
    const sel = r[1].trim();
    if (selectors.has(sel)) duplicateSelectors++;
    selectors.set(sel, true);
  }
  return { totalRules: rules.length, duplicateSelectors, importantCount };
}

async function auditTarget(target) {
  if (/^https?:\/\//i.test(target)) {
    const res = await fetchUrl(target);
    return { httpStatus: res.status, ...auditHtml(res.html, target) };
  }
  const html = fs.readFileSync(path.resolve(target), 'utf8');
  return auditHtml(html, target);
}

module.exports = { auditHtml, auditCss, auditTarget };

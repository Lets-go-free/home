import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rule=css.match(/#tlnvowDiscoveryHost \.project-staking-count\{([^}]*)\}/)?.[1];
assert.ok(rule,'project staking count badge must exist');
assert.match(rule,/color:var\(--text\)/,'theme-specific text contrast');
assert.ok(!rule.includes('color:#d8e9ff'),'old light-on-light label removed');
assert.match(rule,/background:var\(--accent-soft\)/);
assert.match(rule,/border:1px solid/);
assert.ok(html.includes('tln-vow-discovery.css?v=20261122-220523'),
  'refresh the stylesheet URL to bypass cached light-mode rule');
assert.ok(html.includes('window.APP_VERSION="9.70"'));
console.log('9.70: staking badge uses theme text color, old light-on-light removed, cache busted');

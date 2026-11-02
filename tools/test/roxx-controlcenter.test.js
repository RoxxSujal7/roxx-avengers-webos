// Tests that the ROXX Control Center is properly integrated into app/index.html,
// that remote action dispatching works, and that all scripts parse cleanly as ES5.
'use strict';
const fs = require('fs'),
  path = require('path');
const { ok, run } = require('./lib');
const acorn = require(path.join(__dirname, '..', 'vendor', 'acorn.js'));

run(async () => {
  const appPath = path.join(__dirname, '..', '..', 'app', 'index.html');
  ok(fs.existsSync(appPath), 'app/index.html exists');

  const html = fs.readFileSync(appPath, 'utf8');

  // 1. Icon verification
  ok(html.indexOf("roxx: '<path d=\"M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z\"/>'") >= 0, 'app/index.html contains roxx shield icon in ICONS');

  // 2. Action dispatch verification
  ok(html.indexOf("if (o.action === 'roxx') return roxxMenu();") >= 0, 'act(e) handles roxx action and calls roxxMenu()');

  // 3. Top bar pill registration
  ok(html.indexOf("{ label: 'ROXX', icon: 'roxx', action: 'roxx', fixed: true }") >= 0, 'layout.js registers ROXX fixed pill in top bar');

  // 4. roxxMenu definition & items
  ok(html.indexOf("function roxxMenu()") >= 0, 'roxxMenu function is defined');
  ok(html.indexOf("STARK INDUSTRIES × ROXX") >= 0, 'roxxMenu displays STARK INDUSTRIES × ROXX branding');
  ok(html.indexOf("Theme: ROXX Avengers") >= 0, 'roxxMenu provides Theme: ROXX Avengers option');
  ok(html.indexOf("Theme: OLED Black") >= 0, 'roxxMenu provides Theme: OLED Black option');
  ok(html.indexOf("All Themes...") >= 0, 'roxxMenu provides All Themes option');
  ok(html.indexOf("Inputs...") >= 0, 'roxxMenu provides Inputs option');
  ok(html.indexOf("Live TV") >= 0, 'roxxMenu provides Live TV option');
  ok(html.indexOf("Target: LG 43UR7550PSC · webOS 25") >= 0, 'roxxMenu provides Target device telemetry');
  ok(html.indexOf("Cold-Boot Guard: Armed") >= 0, 'roxxMenu provides intro state guard status');

  // 5. Acorn ES5 validation
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m, scriptCount = 0, es5Valid = true;
  while ((m = re.exec(html))) {
    scriptCount++;
    try {
      acorn.parse(m[1], { ecmaVersion: 5 });
    } catch (e) {
      es5Valid = false;
      console.error('ES5 parse error:', e.message);
    }
  }
  ok(scriptCount > 0 && es5Valid, 'app/index.html parses cleanly as ES5 in Acorn');
});

// Tests that tools/build-pages.js correctly handles both LF and CRLF line endings
// when resolving @include directives and @i18n script blocks.
'use strict';
const fs = require('fs'),
  os = require('os'),
  path = require('path');
const { ok, run } = require('./lib');
const acorn = require(path.join(__dirname, '..', 'vendor', 'acorn.js'));
const buildPages = require(path.join(__dirname, '..', 'build-pages.js'));

run(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cytv-crlf-test-'));
  try {
    const srcDir = path.join(tmp, 'fixture-src');
    fs.mkdirSync(srcDir);
    fs.mkdirSync(path.join(srcDir, 'js'));
    fs.mkdirSync(path.join(srcDir, 'css'));

    fs.writeFileSync(path.join(srcDir, 'js', 'sample.js'), 'var fixtureLoaded = 42;\n');
    fs.writeFileSync(path.join(srcDir, 'css', 'sample.css'), 'body { background: #000; }\n');

    // 1. Test LF fixture
    const lfTemplate = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<style>',
      '@include css/sample.css',
      '</style>',
      '</head>',
      '<body>',
      '<script>',
      '@i18n',
      '@include js/sample.js',
      '</script>',
      '</body>',
      '</html>'
    ].join('\n');

    fs.writeFileSync(path.join(srcDir, 'index.html'), lfTemplate);
    const lfBuilt = buildPages.build(path.relative(path.join(__dirname, '..', '..'), srcDir));

    ok(lfBuilt.indexOf('@include') === -1, 'LF fixture expands all @include directives');
    ok(lfBuilt.indexOf('body { background: #000; }') >= 0, 'LF fixture includes CSS content');
    ok(lfBuilt.indexOf('var fixtureLoaded = 42;') >= 0, 'LF fixture includes JS content');
    ok(lfBuilt.indexOf('var I18N =') >= 0, 'LF fixture injects I18N script');

    // 2. Test CRLF fixture
    const crlfTemplate = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<style>',
      '@include css/sample.css',
      '</style>',
      '</head>',
      '<body>',
      '<script>',
      '@i18n',
      '@include js/sample.js',
      '</script>',
      '</body>',
      '</html>'
    ].join('\r\n');

    fs.writeFileSync(path.join(srcDir, 'index.html'), crlfTemplate);
    const crlfBuilt = buildPages.build(path.relative(path.join(__dirname, '..', '..'), srcDir));

    ok(crlfBuilt.indexOf('@include') === -1, 'CRLF fixture expands all @include directives');
    ok(crlfBuilt.indexOf('body { background: #000; }') >= 0, 'CRLF fixture includes CSS content');
    ok(crlfBuilt.indexOf('var fixtureLoaded = 42;') >= 0, 'CRLF fixture includes JS content');
    ok(crlfBuilt.indexOf('var I18N =') >= 0, 'CRLF fixture injects I18N script');

    // 3. Verify ES5 parser on both generated outputs
    const checkEs5 = html => {
      const re = /<script>([\s\S]*?)<\/script>/g;
      let m, count = 0;
      while ((m = re.exec(html))) {
        count++;
        acorn.parse(m[1], { ecmaVersion: 5 });
      }
      return count > 0;
    };

    let lfParsed = false, crlfParsed = false;
    try { lfParsed = checkEs5(lfBuilt); } catch (e) { lfParsed = false; }
    try { crlfParsed = checkEs5(crlfBuilt); } catch (e) { crlfParsed = false; }

    ok(lfParsed, 'LF output parses as valid ES5');
    ok(crlfParsed, 'CRLF output parses as valid ES5');
  } finally {
    // cleanup
    try {
      const rm = dir => {
        if (!fs.existsSync(dir)) return;
        for (const f of fs.readdirSync(dir)) {
          const p = path.join(dir, f);
          if (fs.statSync(p).isDirectory()) rm(p);
          else fs.unlinkSync(p);
        }
        fs.rmdirSync(dir);
      };
      rm(tmp);
    } catch (_) {}
  }
});

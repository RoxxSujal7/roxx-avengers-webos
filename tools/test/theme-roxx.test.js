// Tests that themes/roxx-avengers conforms strictly to helper/themeschema.js
// and resolves the expected STARK INDUSTRIES x ROXX design tokens.
'use strict';
const fs = require('fs'),
  path = require('path');
const { ok, run } = require('./lib');
const themeSchema = require(path.join(__dirname, '..', '..', 'helper', 'themeschema.js'));

run(async () => {
  const themePath = path.join(__dirname, '..', '..', 'themes', 'roxx-avengers', 'theme.json');
  ok(fs.existsSync(themePath), 'themes/roxx-avengers/theme.json exists');

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  } catch (e) {
    raw = null;
  }
  ok(!!raw, 'theme.json is valid JSON');
  ok(raw.name === 'ROXX Avengers', 'theme name is ROXX Avengers');
  ok(raw.author === 'STARK INDUSTRIES × ROXX', 'author is STARK INDUSTRIES × ROXX');

  // Verify schema validation
  const known = new Set(themeSchema.SCHEMA.map(r => r[0]));
  const unknownKeys = [];
  const walk = (o, pre) => {
    for (const k of Object.keys(o)) {
      const key = pre ? pre + '.' + k : k;
      if (key === 'slots') continue;
      if (o[k] && typeof o[k] === 'object') walk(o[k], key);
      else if (!known.has(key) && ['name', 'author', 'description', 'extends'].indexOf(key) < 0) unknownKeys.push(key);
    }
  };
  walk(raw, '');
  ok(unknownKeys.length === 0, 'theme contains zero unknown keys');

  // Verify normalization and CSS resolution
  const norm = themeSchema.normalize(raw, 'roxx-avengers');
  ok(!!norm, 'theme normalizes cleanly against schema');

  const resolved = themeSchema.resolve(norm);
  ok(!!resolved && !!resolved.vars, 'theme resolves CSS variables');
  ok(resolved.vars['--night'] === '#08090b', 'matte black background variable --night is #08090b');
  ok(resolved.vars['--panel'] === '#12151b', 'charcoal panel variable --panel is #12151b');
  ok(resolved.vars['--ink'] === '#f5f6f8', 'primary ink variable --ink is #f5f6f8');
  ok(resolved.vars['--focus'] === '#d12727', 'focus ring variable --focus is #d12727');
  ok(resolved.vars['--acc'] === '#d12727', 'accent variable --acc is #d12727');

  // Verify index.json entry
  const indexPath = path.join(__dirname, '..', '..', 'themes', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const found = (index.themes || []).find(t => t.id === 'roxx-avengers');
  ok(!!found, 'themes/index.json contains roxx-avengers entry');
  if (found) {
    ok(found.name === 'ROXX Avengers', 'index.json entry name matches');
  }
});

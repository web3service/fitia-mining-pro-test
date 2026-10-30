#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(fs.existsSync('/tmp/test-deps/node_modules/jsdom') ? '/tmp/test-deps/node_modules/jsdom' : 'jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
(async () => {
  const manifest = read('android-src/AndroidManifest.xml');
  assert.match(manifest, /package="com\.fitia\.miningpro\.test"/);
  assert.match(manifest, /android:authorities="com\.fitia\.miningpro\.test\.updates"/);
  assert.match(manifest, /android:scheme="fitiaprotest"/);
  assert.match(read('android-src/res/values/strings.xml'), />FITIA PRO TEST</);
  for (const file of ['announcements.js','promotions.js','game-visibility.js','store.js','store-order-service.js','farm.js','app.js','android-src/java/com/fitia/miningpro/MainActivity.java','api/admin.js','admin-server.js','scripts/update_release_manifest.py']) {
    assert(!/web3service\/fitia-mining-pro\/(?!test)|fitia-mining-pro\.vercel\.app/.test(read(file)), file);
  }
  for (const file of ['update.json', 'update-stable.json', 'update-current.json']) {
    const update = JSON.parse(read(file));
    if (!update.enabled) {
      assert.strictEqual(update.apkUrl, '');
      assert.strictEqual(update.sha256, '');
    } else {
      assert.strictEqual(file, 'update-current.json');
      assert.strictEqual(update.apkUrl, `https://github.com/web3service/fitia-mining-pro-test/releases/download/v${update.versionName}/FITIA-PRO-TEST.apk`);
      assert.match(update.sha256, /^[0-9a-f]{64}$/);
    }
  }
  process.env.FITIA_SUPABASE_URL = 'https://example-project.supabase.co';
  process.env.FITIA_SUPABASE_SERVICE_ROLE_KEY = 'test-only-not-a-real-credential';
  assert.throws(() => require('../farm-service').getDefaultFarmService(), /test non configurée/);
  assert.throws(() => require('../store-order-service').getDefaultOrderService(), /test non configurée/);
  process.env.FITIA_SUPABASE_URL = 'https://nywxtykuouywmskavrya.supabase.co';
  process.env.FITIA_SUPABASE_SERVICE_ROLE_KEY = '';
  assert.throws(() => require('../farm-service').getDefaultFarmService(), /configuré/);
  assert.throws(() => require('../store-order-service').getDefaultOrderService(), /configuré/);
  process.env.FITIA_SUPABASE_SERVICE_ROLE_KEY = 'test-only-not-a-real-credential';
  assert.ok(require('../farm-service').getDefaultFarmService());
  assert.ok(require('../store-order-service').getDefaultOrderService());
  const { createAdminServer } = require('../admin-server');
  assert.throws(() => createAdminServer({ password: 'test-only-password', githubToken: 'test', localMode: false, repo: 'fitia-mining-pro' }), /dépôt de test/);
  const dom = new JSDOM('', {url: 'https://app.test.fitia.pro/', runScripts: 'outside-only'});
  dom.window.ethers = require('../vendor/ethers.umd.min.js');
  dom.window.eval(read('wallet.js'));
  const signer = dom.window.FitiaSecurity.Rpc.createSigner('0x' + '01'.repeat(32));
  await assert.rejects(signer.sendTransaction({}), /TEST_TRANSACTIONS_DISABLED/);
  await assert.rejects(signer.signTransaction({}), /TEST_TRANSACTIONS_DISABLED/);
  dom.window.close();
  console.log('Isolation : identité Android, URLs de mise à jour, base, dépôt et signatures vérifiés.');
})().catch(error => { console.error(error); process.exitCode = 1; });

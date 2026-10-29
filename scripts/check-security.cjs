const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

function loadSource(name) {
  const filename = path.resolve(__dirname, '..', name);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

async function main() {
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-only-secret';
  const session = loadSource('lib/adminSession.ts');
  const token = session.createAdminSessionToken();
  assert.equal(session.verifyAdminSessionToken(token), true);
  assert.notEqual(token, session.createAdminSessionToken());
  assert.equal(session.verifyAdminSessionToken(token + 'x'), false);
  assert.equal(session.verifyAdminSessionToken('mindlet-admin-v1.old-signature'), false);
  const realNow = Date.now;
  Date.now = () => realNow() + (session.ADMIN_SESSION_SECONDS + 1) * 1000;
  assert.equal(session.verifyAdminSessionToken(token), false);
  Date.now = realNow;
  process.env.ADMIN_PASSWORD = 'changed-password';
  assert.equal(session.verifyAdminSessionToken(token), false);
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(session.verifyAdminSessionToken(token), false);

  const input = loadSource('lib/request.ts');
  for (const body of ['null', '[]', '"text"', '{broken']) {
    assert.equal(await input.readJsonObject(new Request('http://localhost', { method: 'POST', body })), null);
  }
  assert.deepEqual(await input.readJsonObject(new Request('http://localhost', { method: 'POST', body: '{"title":"메모"}' })), { title: '메모' });
  assert.equal(input.isMemoId('invalid'), false);
  assert.equal(input.isMemoId('00000000-0000-4000-8000-000000000000'), true);
  assert.equal(input.invalidRequest().status, 400);
  const password = loadSource('lib/password.ts');
  assert.equal(password.verifyPlainPassword('same', 'same'), true);
  assert.equal(password.verifyPlainPassword('wrong', 'same'), false);
  assert.equal(await password.verifyPassword('1234', await password.hashPassword('1234')), true);
  console.log('Session expiry, tampering, credential rotation, JSON validation and passwords: PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

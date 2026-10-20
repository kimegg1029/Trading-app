import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
if (!scripts.length) throw new Error('public/index.html에 실행 스크립트가 없습니다.');
for (const source of scripts) new vm.Script(source, { filename: 'public/index.html inline script' });
for (const required of ['/api/auth/login', '/api/profiles', '/api/profile', '/api/credentials/upbit', '/api/pyramid/orders']) {
  if (!html.includes(required)) throw new Error(`프런트엔드 API 연결이 없습니다: ${required}`);
}
console.log('Frontend JavaScript syntax OK');

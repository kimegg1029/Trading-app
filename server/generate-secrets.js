import crypto from 'node:crypto';
console.log('SESSION_SECRET=' + crypto.randomBytes(48).toString('base64url'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('base64'));

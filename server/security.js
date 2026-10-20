import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export function encryptSecret(value) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(part => part.toString('base64')).join('.');
}

export function decryptSecret(payload) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  const [ivText, tagText, encryptedText] = payload.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64')), decipher.final()]).toString('utf8');
}

export function createSessionToken(user) {
  return jwt.sign({ sub: user }, process.env.SESSION_SECRET, { algorithm: 'HS256', expiresIn: '8h', issuer: 'ozu-trading' });
}

export function verifySessionToken(token) {
  const decoded = jwt.verify(token, process.env.SESSION_SECRET, { algorithms: ['HS256'], issuer: 'ozu-trading' });
  if (!['오주', '혜령'].includes(decoded.sub)) throw new Error('Invalid session user');
  return decoded.sub;
}

export function makeIdentifier(batchId, user, entryNo, side) {
  // Upbit identifier length is limited; stable UUID-derived value prevents accidental duplicate submissions.
  const compact = batchId.replaceAll('-', '').slice(0, 12);
  const who = user === '오주' ? 'o' : 'h';
  const direction = side === 'bid' ? 'b' : 's';
  return `ozu${compact}${who}${direction}${String(entryNo).padStart(2, '0')}`.slice(0, 32);
}

export const newBatchId = () => crypto.randomUUID();

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const BASE = 'https://api.upbit.com';

function queryString(params = {}) {
  const pairs = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) for (const item of value) pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
    else pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return pairs.join('&');
}

function makeToken(accessKey, secretKey, qs = '') {
  const payload = { access_key: accessKey, nonce: crypto.randomUUID() };
  if (qs) {
    payload.query_hash = crypto.createHash('sha512').update(qs, 'utf8').digest('hex');
    payload.query_hash_alg = 'SHA512';
  }
  return jwt.sign(payload, secretKey, { algorithm: 'HS512' });
}

export async function upbitRequest(credentials, method, path, params = {}) {
  const qs = queryString(params);
  const token = makeToken(credentials.accessKey, credentials.secretKey, qs);
  const url = `${BASE}${path}${method === 'GET' || method === 'DELETE' ? (qs ? `?${qs}` : '') : ''}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      ...(method === 'POST' ? { body: JSON.stringify(params) } : {}),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || `Upbit API error (${response.status})`);
      error.status = response.status;
      error.upbitError = data?.error?.name || null;
      throw error;
    }
    return data;
  } finally { clearTimeout(timeout); }
}

export async function publicRequest(path, params = {}) {
  const qs = queryString(params);
  const response = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Upbit public API error (${response.status})`);
  return data;
}

export function marketCode(symbol) {
  const allowed = new Set(['BTC','ETH','XRP','SOL','DOGE','ADA','AVAX','LINK','DOT','TRX','SHIB','ETC','BCH','NEAR','APT','SUI']);
  if (!allowed.has(symbol)) throw new Error('지원하지 않는 코인입니다.');
  return `KRW-${symbol}`;
}

export function krwTick(price) {
  if (price >= 2000000) return 1000;
  if (price >= 1000000) return 1000;
  if (price >= 500000) return 500;
  if (price >= 100000) return 100;
  if (price >= 50000) return 50;
  if (price >= 10000) return 10;
  if (price >= 5000) return 5;
  if (price >= 1000) return 1;
  if (price >= 100) return 1;
  if (price >= 10) return 0.1;
  if (price >= 1) return 0.01;
  if (price >= 0.1) return 0.001;
  if (price >= 0.01) return 0.0001;
  if (price >= 0.001) return 0.00001;
  if (price >= 0.0001) return 0.000001;
  if (price >= 0.00001) return 0.0000001;
  return 0.00000001;
}

export function floorToTick(price) {
  const tick = krwTick(price);
  const digits = Math.max(0, Math.min(8, (String(tick).split('.')[1] || '').length));
  return Number((Math.floor((price + Number.EPSILON) / tick) * tick).toFixed(digits));
}

export function volumeForFunds(funds, price) {
  return Number((Math.floor((funds / price) * 1e8) / 1e8).toFixed(8));
}

import crypto from 'crypto';
import querystring from 'querystring';

export function encodePayseraData(params) {
  const query = querystring.stringify(params);
  const base64 = Buffer.from(query, 'utf8').toString('base64');

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function decodePayseraData(data) {
  const base64 = data
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  return querystring.parse(decoded);
}

export function signPayseraData(data, password) {
  return crypto
    .createHash('md5')
    .update(data + password)
    .digest('hex');
}

export function verifyPayseraSignature(data, signature, password) {
  const expectedSignature = signPayseraData(data, password);
  return expectedSignature === signature;
}

export function convertEurosToCents(amount) {
  return Math.round(Number(amount) * 100);
}
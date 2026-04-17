import crypto from 'crypto';

const PAYSERA_ENCRYPTION_KEY = process.env.PAYSERA_ENCRYPTION_KEY || '';

/**
 * Iššifruoja mokėjimo eilutės lauką (AES-GCM) arba grąžina gryną tekstą, kai šifravimas išjungtas.
 */
export function decryptPaymentField(value) {
  if (value == null || value === '') return null;

  const s = String(value);

  if (!PAYSERA_ENCRYPTION_KEY) {
    return s;
  }

  try {
    const parts = s.split(':');
    if (parts.length !== 3) {
      return s;
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const key = crypto
      .createHash('sha256')
      .update(PAYSERA_ENCRYPTION_KEY)
      .digest();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Failed to decrypt payment field', error);
    return null;
  }
}

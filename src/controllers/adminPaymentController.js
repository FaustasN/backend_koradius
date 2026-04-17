import crypto from 'crypto';
import { db } from '../config/db.js';

const PAYSERA_ENCRYPTION_KEY = process.env.PAYSERA_ENCRYPTION_KEY || '';

function decryptIfNeeded(value) {
  if (!value) return null;

  if (!PAYSERA_ENCRYPTION_KEY) {
    console.warn('PAYSERA_ENCRYPTION_KEY is not set, cannot decrypt payment field');
    return null;
  }

  try {
    const parts = String(value).split(':');

    if (parts.length !== 3) {
      return value;
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const key = crypto.createHash('sha256').update(PAYSERA_ENCRYPTION_KEY).digest();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Failed to decrypt payment field', error);
    return null;
  }
}

export async function getAllPayments(_req, res, next) {
  try {
    const result = await db.query(
      `
      SELECT
        p.id,
        p.order_id,
        p.travel_packet_id,
        tp.title AS travel_packet_title,
        p.amount,
        p.currency,
        p.description,
        p.status,
        p.paysera_status,
        p.is_test,
        p.payment_method,
        p.pay_amount,
        p.pay_currency,
        p.customer_email_encrypted,
        p.customer_name_encrypted,
        p.customer_phone_encrypted,
        p.product_info_encrypted,
        p.callback_raw,
        p.paid_at,
        p.failed_at,
        p.created_at,
        p.updated_at
      FROM payments p
      LEFT JOIN travel_packets tp ON tp.id = p.travel_packet_id
      ORDER BY p.created_at DESC
      `
    );

    const payments = result.rows.map((row) => {
      const decryptedProductInfoRaw = decryptIfNeeded(row.product_info_encrypted);

      let product_info = null;

      if (decryptedProductInfoRaw) {
        try {
          product_info = JSON.parse(decryptedProductInfoRaw);
        } catch {
          product_info = decryptedProductInfoRaw;
        }
      }

      return {
        ...row,
        customer_email: decryptIfNeeded(row.customer_email_encrypted),
        customer_name: decryptIfNeeded(row.customer_name_encrypted),
        customer_phone: decryptIfNeeded(row.customer_phone_encrypted),
        product_info
      };
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
}
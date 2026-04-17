import { db } from '../config/db.js';
import { decryptPaymentField } from '../utils/paymentFieldDecrypt.js';

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
      const decryptedProductInfoRaw = decryptPaymentField(
        row.product_info_encrypted
      );

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
        customer_email: decryptPaymentField(row.customer_email_encrypted),
        customer_name: decryptPaymentField(row.customer_name_encrypted),
        customer_phone: decryptPaymentField(row.customer_phone_encrypted),
        product_info
      };
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
}
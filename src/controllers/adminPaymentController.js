import { db } from '../config/db.js';

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

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}
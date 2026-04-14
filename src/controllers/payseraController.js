import crypto from 'crypto';
import { db } from '../config/db.js';
import {
  encodePayseraData,
  decodePayseraData,
  signPayseraData,
  verifyPayseraSignature,
  convertEurosToCents
} from '../utils/paysera.js';

const PAYSERA_PROJECT_ID = process.env.PAYSERA_PROJECT_ID;
const PAYSERA_SIGN_PASSWORD = process.env.PAYSERA_SIGN_PASSWORD;
const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

const PAYSERA_PAYMENT_URL = 'https://www.paysera.com/pay/';

function generateOrderId() {
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `ORD-${Date.now()}-${randomPart}`;
}

// Jei turi savo encrypt funkciją projekte, vėliau čia įdėsi ją.
// Kol kas paliekam plain text, kad flow veiktų.
function encryptIfNeeded(value) {
  if (!value) return null;
  return value;
}

export async function createPayment(req, res, next) {
  try {
    const {
      travelPacketId,
      name,
      phone,
      email,
      departureDate,
      numberOfPeople
    } = req.body;

    if (
      !travelPacketId ||
      !name ||
      !phone ||
      !email ||
      !departureDate ||
      !numberOfPeople
    ) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const peopleCount = Number(numberOfPeople);

    if (!Number.isInteger(peopleCount) || peopleCount < 1) {
      return res.status(400).json({
        error: 'Invalid number of people'
      });
    }

    const packetResult = await db.query(
      `
      SELECT *
      FROM travel_packets
      WHERE id = $1 AND is_active = true
      LIMIT 1
      `,
      [travelPacketId]
    );

    if (packetResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Travel packet not found'
      });
    }

    const travelPacket = packetResult.rows[0];

    const unitPrice = Number(travelPacket.price);
    const totalAmountEur = unitPrice * peopleCount;
    const totalAmountCents = convertEurosToCents(totalAmountEur);

    const orderId = generateOrderId();

    const description = `${travelPacket.title} | ${peopleCount} person(s) | ${departureDate}`;

    await db.query(
      `
      INSERT INTO payments (
        order_id,
        travel_packet_id,
        amount,
        currency,
        description,
        status,
        customer_email_encrypted,
        customer_name_encrypted,
        customer_phone_encrypted,
        product_info_encrypted
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9)
      `,
      [
        orderId,
        travelPacket.id,
        totalAmountCents,
        'EUR',
        description,
        encryptIfNeeded(email.trim()),
        encryptIfNeeded(name.trim()),
        encryptIfNeeded(phone.trim()),
        encryptIfNeeded(
          JSON.stringify({
            departureDate,
            numberOfPeople: peopleCount,
            travelPacketTitle: travelPacket.title,
            unitPrice,
            totalAmountEur
          })
        )
      ]
    );

    const payseraParams = {
      projectid: PAYSERA_PROJECT_ID,
      sign_password: PAYSERA_SIGN_PASSWORD,
      orderid: orderId,
      amount: String(totalAmountCents),
      currency: 'EUR',
      country: 'LT',
      accepturl: `${BACKEND_URL}/api/paysera/accept?orderId=${encodeURIComponent(orderId)}`,
      cancelurl: `${BACKEND_URL}/api/paysera/cancel?orderId=${encodeURIComponent(orderId)}`,
      callbackurl: `${BACKEND_URL}/api/paysera/callback`,
      test: '1',
      version: '1.6',
      lang: 'LIT',
      p_email: email.trim(),
      paytext: description
    };

    delete payseraParams.sign_password;

    const data = encodePayseraData(payseraParams);
    const sign = signPayseraData(data, PAYSERA_SIGN_PASSWORD);

    const paymentUrl = `${PAYSERA_PAYMENT_URL}?data=${encodeURIComponent(data)}&sign=${sign}`;

    return res.status(201).json({
      paymentUrl,
      orderId
    });
  } catch (error) {
    next(error);
  }
}

export async function handlePayseraCallback(req, res, next) {
  try {
    const { data, ss1 } = req.query;

    if (!data || !ss1) {
      return res.status(400).send('Missing callback parameters');
    }

    const isValidSignature = verifyPayseraSignature(
      data,
      ss1,
      PAYSERA_SIGN_PASSWORD
    );

    if (!isValidSignature) {
      return res.status(400).send('Invalid signature');
    }

    const callbackData = decodePayseraData(data);

    const {
      orderid,
      status,
      amount,
      currency,
      payamount,
      paycurrency,
      payment,
      test
    } = callbackData;

    const paymentResult = await db.query(
      `
      SELECT *
      FROM payments
      WHERE order_id = $1
      LIMIT 1
      `,
      [orderid]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).send('Payment not found');
    }

    const existingPayment = paymentResult.rows[0];

    // idempotency
    if (existingPayment.status === 'paid') {
      return res.send('OK');
    }

    if (
      Number(existingPayment.amount) !== Number(amount) ||
      existingPayment.currency !== currency
    ) {
      await db.query(
        `
        UPDATE payments
        SET status = 'failed',
            paysera_status = $1,
            pay_amount = $2,
            pay_currency = $3,
            payment_method = $4,
            is_test = $5,
            callback_raw = $6,
            failed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $7
        `,
        [
          status ? Number(status) : null,
          payamount ? Number(payamount) : null,
          paycurrency || null,
          payment || null,
          test === '1',
          JSON.stringify(callbackData),
          orderid
        ]
      );
      console.log('CALLBACK HIT', req.query)
      return res.status(400).send('Amount or currency mismatch');
    }

    if (String(status) === '1') {
      await db.query(
        `
        UPDATE payments
        SET status = 'paid',
            paysera_status = $1,
            pay_amount = $2,
            pay_currency = $3,
            payment_method = $4,
            is_test = $5,
            callback_raw = $6,
            paid_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $7
        `,
        [
          Number(status),
          payamount ? Number(payamount) : null,
          paycurrency || null,
          payment || null,
          test === '1',
          JSON.stringify(callbackData),
          orderid
        ]
      );

      return res.send('OK');
    }

    await db.query(
      `
      UPDATE payments
      SET status = 'failed',
          paysera_status = $1,
          pay_amount = $2,
          pay_currency = $3,
          payment_method = $4,
          is_test = $5,
          callback_raw = $6,
          failed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $7
      `,
      [
        status ? Number(status) : null,
        payamount ? Number(payamount) : null,
        paycurrency || null,
        payment || null,
        test === '1',
        JSON.stringify(callbackData),
        orderid
      ]
    );

    return res.send('OK');
  } catch (error) {
    next(error);
  }
}

export async function handlePayseraAccept(req, res, next) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.redirect(`${FRONTEND_URL}/payment/success`);
    }

    return res.redirect(
      `${FRONTEND_URL}/payment/success?orderId=${encodeURIComponent(orderId)}`
    );
  } catch (error) {
    next(error);
  }
}

export async function handlePayseraCancel(req, res, next) {
  try {
    const { orderId } = req.query;

    if (orderId) {
      await db.query(
        `
        UPDATE payments
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1
          AND status = 'pending'
        `,
        [orderId]
      );
    }

    return res.redirect(
      `${FRONTEND_URL}/payment/cancel${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`
    );
  } catch (error) {
    next(error);
  }
}
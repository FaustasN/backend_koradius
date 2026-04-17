import { getMailTransporter } from '../config/mailTransporter.js';
import { decryptPaymentField } from '../utils/paymentFieldDecrypt.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatLtDate(value) {
  if (!value) return '—';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleString('lt-LT', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function amountEurFromCents(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return '—';
  return (n / 100).toFixed(2);
}

function isValidEmail(email) {
  return typeof email === 'string' && email.includes('@');
}

/**
 * Kviečiama iš handlePayseraCallback po sėkmingo UPDATE į `paid`.
 *
 * @param {{ orderId: string; callbackData: Record<string, unknown>; paymentRow: object }} ctx
 */
export async function runAfterPayseraPaid(ctx) {
  const { orderId, paymentRow } = ctx;

  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn('[Paysera] SMTP not configured; skip order confirmation emails');
    return;
  }

  const customerName =
    decryptPaymentField(paymentRow.customer_name_encrypted) || '—';
  const customerPhone =
    decryptPaymentField(paymentRow.customer_phone_encrypted) || '—';
  const customerEmail =
    decryptPaymentField(paymentRow.customer_email_encrypted) || '—';

  let productInfo = {};
  const rawProduct = decryptPaymentField(paymentRow.product_info_encrypted);

  if (rawProduct) {
    try {
      productInfo = JSON.parse(rawProduct);
    } catch {
      productInfo = {};
    }
  }

  const departureDate = productInfo.departureDate ?? '—';
  const numberOfPeople = productInfo.numberOfPeople ?? '—';
  const travelTitle = productInfo.travelPacketTitle ?? '—';

  // paymentRow callback metu gali būti senas snapshotas, todėl paid_at gali būti dar tuščias
  const paidAtResolved = paymentRow.paid_at || new Date();

  const totalAmountEur =
    productInfo.totalAmountEur != null
      ? String(productInfo.totalAmountEur)
      : amountEurFromCents(paymentRow.amount);

  const currency = paymentRow.currency || 'EUR';

  const adminTo =  process.env.CONTACT_INBOX_TO?.trim() ||  'koradiustravel@gmail.com';

  const from = process.env.MAIL_FROM?.trim() || `Koradius <${process.env.SMTP_USER}>`;

  // -------------------------
  // 1. LAIŠKAS ADMINUI
  // -------------------------
  const adminSubject = `[Koradius] Apmokėtas užsakymas ${orderId}`;

  const adminText = [
    'Gautas naujas apmokėtas užsakymas.',
    '',
    `Užsakymo numeris: ${orderId}`,
    `Vardas ir pavardė: ${customerName}`,
    `El. paštas: ${customerEmail}`,
    `Telefono numeris: ${customerPhone}`,
    '',
    `Kelionė: ${travelTitle}`,
    `Pageidaujama išvykimo data: ${departureDate}`,
    `Žmonių skaičius: ${numberOfPeople}`,
    `Suma: ${totalAmountEur} ${currency}`,
    '',
    `Užsakymo sukūrimo data: ${formatLtDate(paymentRow.created_at)}`,
    `Apmokėjimo data: ${formatLtDate(paidAtResolved)}`,
    '',
    `Aprašymas (DB): ${paymentRow.description || '—'}`,
  ].join('\n');

  const adminHtml = `
    <div style="font-family:sans-serif;max-width:640px;">
      <h2 style="color:#0d9488;">Naujas apmokėtas užsakymas</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px 0;"><strong>Užsakymo numeris</strong></td><td>${escapeHtml(orderId)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Vardas ir pavardė</strong></td><td>${escapeHtml(customerName)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>El. paštas</strong></td><td>${escapeHtml(customerEmail)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Telefonas</strong></td><td>${escapeHtml(customerPhone)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Kelionė</strong></td><td>${escapeHtml(travelTitle)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Išvykimo data</strong></td><td>${escapeHtml(String(departureDate))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Žmonių skaičius</strong></td><td>${escapeHtml(String(numberOfPeople))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Suma</strong></td><td>${escapeHtml(String(totalAmountEur))} ${escapeHtml(currency)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Užsakymo sukūrimas</strong></td><td>${escapeHtml(formatLtDate(paymentRow.created_at))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Apmokėjimas</strong></td><td>${escapeHtml(formatLtDate(paidAtResolved))}</td></tr>
      </table>
      <p style="margin-top:1rem;color:#4b5563;">
        <strong>Aprašymas:</strong> ${escapeHtml(paymentRow.description || '—')}
      </p>
    </div>
  `;

  const adminMail = {
    from,
    to: adminTo,
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
    ...(isValidEmail(customerEmail) ? { replyTo: customerEmail.trim() } : {}),
  };

  // -------------------------
  // 2. LAIŠKAS PIRKĖJUI
  // -------------------------
  const customerSubject = `Ačiū už jūsų užsakymą, ${customerName}`;

  const customerText = [
    `Sveiki${customerName !== '—' ? `, ${customerName}` : ''},`,
    '',
    'Ačiū, kad pirkote. Susisieksime su jumis netrukus.',
    '',
    `Užsakymo numeris: ${orderId}`,
    `Kelionės paketas: ${travelTitle}`,
    `Žmonių skaičius: ${numberOfPeople}`,
    `Kaina: ${totalAmountEur} ${currency}`,
    '',
    'Jeigu turėsite klausimų, atsakykite į šį laišką.',
    '',
    'Pagarbiai,',
    'Koradius komanda',
  ].join('\n');

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="margin:0 0 16px 0;color:#0d9488;">Ačiū už jūsų užsakymą</h2>

        <p style="margin:0 0 16px 0;">
          Sveiki${customerName !== '—' ? `, <strong>${escapeHtml(customerName)}</strong>` : ''},
        </p>

        <p style="margin:0 0 16px 0;">
          Ačiū, kad pirkote. Susisieksime su jumis netrukus.
        </p>

        <table style="border-collapse:collapse;width:100%;margin-top:16px;">
          <tr>
            <td style="padding:8px 0;"><strong>Užsakymo numeris</strong></td>
            <td style="padding:8px 0;">${escapeHtml(orderId)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;"><strong>Kelionės paketas</strong></td>
            <td style="padding:8px 0;">${escapeHtml(travelTitle)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;"><strong>Žmonių skaičius</strong></td>
            <td style="padding:8px 0;">${escapeHtml(String(numberOfPeople))}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;"><strong>Kaina</strong></td>
            <td style="padding:8px 0;">${escapeHtml(String(totalAmountEur))} ${escapeHtml(currency)}</td>
          </tr>
        </table>

        <p style="margin-top:24px;color:#4b5563;">
          Jeigu turėsite klausimų, tiesiog atsakykite į šį laišką.
        </p>

        <p style="margin-top:24px;">
          Pagarbiai,<br />
          <strong>Koradius komanda</strong>
        </p>
      </div>
    </div>
  `;

  const emailsToSend = [transporter.sendMail(adminMail)];

  if (isValidEmail(customerEmail)) {
    emailsToSend.push(
      transporter.sendMail({
        from,
        to: customerEmail.trim(),
        subject: customerSubject,
        text: customerText,
        html: customerHtml,
      })
    );
  } else {
    console.warn(`[Paysera] Invalid customer email for order ${orderId}, skip customer email`);
  }

  await Promise.all(emailsToSend);
}
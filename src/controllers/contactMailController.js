import { getMailTransporter } from '../config/mailTransporter.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendContactMail(req, res, next) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(503).json({
        message:
          'Mail is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
      });
    }

    const {
      name,
      email,
      phone,
      subject,
      message,
      preferredContact,
      urgency,
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const to =
      process.env.CONTACT_INBOX_TO?.trim() || 'koradiustravel@gmail.com';
    const from =
      process.env.MAIL_FROM?.trim() || `Koradius svetainė <${process.env.SMTP_USER}>`;

    const text = [
      'Nauja užklausa iš kontaktų formos',
      '',
      `Vardas: ${name}`,
      `El. paštas: ${email}`,
      `Telefonas: ${phone || '—'}`,
      `Tema: ${subject}`,
      `Skubumas: ${urgency || '—'}`,
      `Pageidaujamas ryšys: ${preferredContact || '—'}`,
      '',
      'Žinutė:',
      message,
    ].join('\n');

    const html = `
      <div style="font-family: sans-serif; max-width: 640px;">
        <h2 style="color:#0d9488;">Nauja užklausa iš kontaktų formos</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:6px 0;"><strong>Vardas</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>El. paštas</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Telefonas</strong></td><td>${escapeHtml(phone || '—')}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Tema</strong></td><td>${escapeHtml(subject)}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Skubumas</strong></td><td>${escapeHtml(urgency || '—')}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Ryšys</strong></td><td>${escapeHtml(preferredContact || '—')}</td></tr>
        </table>
        <h3 style="margin-top:1.5rem;">Žinutė</h3>
        <p style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:8px;">${escapeHtml(message)}</p>
      </div>`;

    await transporter.sendMail({
      from,
      to,
      replyTo: String(email).trim(),
      subject: `[Koradius kontaktai] ${subject}`,
      text,
      html,
    });

    res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    next(error);
  }
}

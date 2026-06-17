module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, email, service, suburb, message } = req.body || {};

  if (!name || !phone || !service || !suburb) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('Missing RESEND_API_KEY or CONTACT_EMAIL env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1d40ab;">New Quote Request</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 12px;font-weight:700;background:#f5f5f5;width:140px;">Name</td><td style="padding:8px 12px;">${name}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;background:#f5f5f5;">Phone</td><td style="padding:8px 12px;"><a href="tel:${phone}">${phone}</a></td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;background:#f5f5f5;">Email</td><td style="padding:8px 12px;">${email ? `<a href="mailto:${email}">${email}</a>` : '—'}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;background:#f5f5f5;">Service</td><td style="padding:8px 12px;">${service}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;background:#f5f5f5;">Suburb</td><td style="padding:8px 12px;">${suburb}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;background:#f5f5f5;">Message</td><td style="padding:8px 12px;">${message || '—'}</td></tr>
      </table>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Your Local Carpet Cleaner <noreply@yourlocalcarpetcleaner.com.au>',
      to: [toEmail],
      reply_to: email || undefined,
      subject: `New Quote Request — ${name} (${service}, ${suburb})`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ success: true });
};

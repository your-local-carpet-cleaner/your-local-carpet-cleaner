module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, email, service, suburb, message } = req.body || {};

  if ( !phone || !service ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const response = await fetch('https://formspree.io/f/mlgkqazj', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      phone,
      email,
      service,
      suburb,
      message,
      _replyto: email || undefined,
      _subject: `New Quote Request — ${name} (${service}, ${suburb})`,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Formspree error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ success: true });
};

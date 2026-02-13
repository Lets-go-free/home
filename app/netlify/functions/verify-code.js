// netlify/functions/verify-code.js
// Prüft ob ein Zugangscode gültig ist
// Codes werden als Netlify Environment Variable gespeichert: LGF_CODES
// Format: kommagetrennte Liste, z.B. "ABC123,XYZ456,LGF789"

exports.handler = async function(event) {
  // Nur POST erlauben
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: 'Ungültige Anfrage' }) };
  }

  const inputCode = (body.code || '').trim().toUpperCase();

  if (!inputCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ valid: false, error: 'Kein Code eingegeben' })
    };
  }

  // Codes aus Environment Variable laden
  const codesRaw = process.env.LGF_CODES || '';
  const validCodes = codesRaw
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(c => c.length > 0);

  const isValid = validCodes.includes(inputCode);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      valid: isValid,
      message: isValid ? 'Zugang freigeschaltet!' : 'Ungültiger Code'
    })
  };
};

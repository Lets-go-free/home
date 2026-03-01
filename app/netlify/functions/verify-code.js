// netlify/functions/verify-code.js
// Zugangscodes hier eintragen – einen pro Zeile
// Neue Codes einfach hinzufügen, committen – fertig.

const VALID_CODES = [
  'LGF-2026',
];

// Update-Bemerkung – wird neu direkt in index.html als UPDATE_MESSAGE verwaltet
//const UPDATE_MESSAGE = 'Technisches Update, keine weitere Aktion notwendig.';

// Aktuelle App-Version (muss mit CURRENT_VERSION in index.html übereinstimmen)
const CURRENT_VERSION = '1.0.1';

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ valid: false }) };
  }

  const inputCode = (body.code || '').trim().toUpperCase();
  const isValid = VALID_CODES.map(c => c.toUpperCase()).includes(inputCode);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      valid: isValid,
      message: isValid ? 'Zugang freigeschaltet!' : 'Ungültiger Code',
      currentVersion: CURRENT_VERSION
    })
  };
};

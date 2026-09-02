/**
 * GitHub OAuth callback for Decap CMS on Vercel.
 */
export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return res.status(400).send('OAuth configuration error');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback`;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  if (!token) {
    return res.status(401).send('GitHub authorization failed');
  }

  const authPayload = JSON.stringify({ token, provider: 'github' });

  const body = `
(function() {
  var payload = ${JSON.stringify(authPayload)};
  function receiveMessage(e) {
    window.opener.postMessage('authorization:github:success:' + payload, e.origin);
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(body);
}

/**
 * GitHub OAuth entry for Decap CMS on Vercel.
 * Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the hosting env.
 */
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('Missing GITHUB_CLIENT_ID');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback`;

  const authorizeUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&scope=repo,user';

  res.redirect(302, authorizeUrl);
}

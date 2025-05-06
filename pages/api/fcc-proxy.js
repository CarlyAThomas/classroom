export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('In fcc-proxy ******************************');

    // Parse cookies from request header
    const cookies = {};
    if (req.headers.cookie) {
      req.headers.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = decodeURIComponent(value);
      });
    }

    // Get token from cookie if it exists, otherwise from body
    const cookieToken = cookies.jwt_access_token;
    const { options } = req.body;

    if (!cookieToken) {
      console.log('Unauthorized!');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // The actual URL to FCC's API
    const fccUrl = 'http://localhost:3000/api/hello';

    const headers = {
      ...options?.headers,
      'Content-Type': 'application/json',
      Cookie: `jwt_access_token=${cookieToken}`
    };

    // Make the request from the server
    const fccResponse = await fetch(fccUrl, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Get the response data
    const data = await fccResponse.json();

    // Return the data to the client
    return res.status(fccResponse.status).json(data);
  } catch (error) {
    console.error('Error proxying request to FCC:', error);
    return res.status(500).json({ error: 'Failed to fetch from FCC' });
  }
}

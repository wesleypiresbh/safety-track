import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Clear the authentication token cookie
    res.setHeader('Set-Cookie', serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // Use secure in production
      sameSite: 'Lax',
      path: '/',
      expires: new Date(0), // Set expiry to past to delete cookie
    }));

    res.status(200).json({ message: 'Logged out successfully.' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
}


import { authMiddleware } from '@/middleware/authMiddleware';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const response = await fetch(`${req.headers.origin}/api/db-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie, // Forward cookies for auth
        },
        body: JSON.stringify({ functionName: 'addOS', args: [req.body] }),
      });
      const newOS = await response.json();
      res.status(201).json(newOS);
    } catch (error) {
      console.error('Error adding OS:', error);
      res.status(500).json({ message: error.message || 'Falha ao adicionar OS.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

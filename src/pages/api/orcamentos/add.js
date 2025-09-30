
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
        body: JSON.stringify({ functionName: 'addOrcamento', args: [req.body] }),
      });
      const newOrcamento = await response.json();
      res.status(201).json(newOrcamento);
    } catch (error) {
      console.error('Error adding orcamento:', error);
      res.status(500).json({ message: error.message || 'Falha ao adicionar orçamento.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default authMiddleware(handler);

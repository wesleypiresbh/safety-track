
import { authMiddleware } from '@/middleware/authMiddleware';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const { cpfCnpj } = req.query;
    if (!cpfCnpj) {
      return res.status(400).json({ message: 'CPF/CNPJ é obrigatório.' });
    }
    try {
      const response = await fetch(`${req.headers.origin}/api/db-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie, // Forward cookies for auth
        },
        body: JSON.stringify({ functionName: 'getClientByCpfCnpj', args: [cpfCnpj] }),
      });
      const client = await response.json();
      res.status(200).json({ isTaken: !!client });
    } catch (error) {
      console.error('Error checking CPF/CNPJ:', error);
      res.status(500).json({ message: error.message || 'Failed to check CPF/CNPJ.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default authMiddleware(handler);

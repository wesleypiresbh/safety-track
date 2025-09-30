import { authMiddleware } from '@/middleware/authMiddleware';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    // req.user will be available here if the token is valid
    res.status(200).json({ user: req.user, message: 'Dados de usuário protegidos.' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

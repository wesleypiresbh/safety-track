import jwt from 'jsonwebtoken';

export const authMiddleware = (handler) => async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Nenhum token de autenticação fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded; // Anexa informações do usuário à requisição
    return handler(req, res);
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return res.status(401).json({ message: 'Token de autenticação inválido ou expirado.' });
  }
};

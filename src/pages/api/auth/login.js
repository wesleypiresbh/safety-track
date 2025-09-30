import { loginWithEmail } from '@/services/authService';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
      const user = await loginWithEmail(email, password);
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

      res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60}`); // 1 hour
      res.status(200).json({ message: 'Logged in successfully.', user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error('Erro de login:', error);
      res.status(401).json({ message: error.message || 'Credenciais inválidas.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
}

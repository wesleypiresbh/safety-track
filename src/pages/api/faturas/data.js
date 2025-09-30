import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const faturasResult = await pool.query('SELECT * FROM faturas ORDER BY data_emissao DESC');

    res.status(200).json({ faturas: faturasResult.rows });
  } catch (error) {
    console.error('Error fetching faturas:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

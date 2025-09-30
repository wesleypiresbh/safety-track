import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    await pool.query('UPDATE faturas SET status = $1 WHERE id = $2', [status, id]);

    res.status(200).json({ message: 'Fatura status updated successfully' });
  } catch (error) {
    console.error(`Error updating fatura ${id} status:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { osId } = req.body;

  if (!osId) {
    return res.status(400).json({ message: 'OS ID is required' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const osResult = await pool.query('SELECT * FROM service_orders WHERE id = $1', [osId]);
    if (osResult.rows.length === 0) {
      return res.status(404).json({ message: 'Service order not found' });
    }

    const os = osResult.rows[0];

    const faturaResult = await pool.query(
      'INSERT INTO faturas (os_id, valor_total) VALUES ($1, $2) RETURNING *',
      [osId, os.total_price]
    );

    res.status(201).json({ fatura: faturaResult.rows[0] });
  } catch (error) {
    console.error('Error creating fatura:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

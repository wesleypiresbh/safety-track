import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const faturaResult = await pool.query('SELECT * FROM faturas WHERE id = $1', [id]);
    if (faturaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Fatura not found' });
    }
    const fatura = faturaResult.rows[0];

    const osResult = await pool.query('SELECT * FROM service_orders WHERE id = $1', [fatura.os_id]);
    if (osResult.rows.length === 0) {
      return res.status(404).json({ message: 'Service Order not found' });
    }
    const os = osResult.rows[0];

    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [os.client_id]);
    const client = clientResult.rows[0];

    const vehicleResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [os.vehicle_id]);
    const vehicle = vehicleResult.rows[0];

    const servicesResult = await pool.query('SELECT * FROM services');
    const services = servicesResult.rows;

    res.status(200).json({ fatura, os, client, vehicle, services });
  } catch (error) {
    console.error(`Error fetching fatura ${id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

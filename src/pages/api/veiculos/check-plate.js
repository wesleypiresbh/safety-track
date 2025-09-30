
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const { plate } = req.query;
    if (!plate) {
      return res.status(400).json({ message: 'Plate is required.' });
    }
    try {
      const vehicle = await dataService.getVehicleByPlate(plate);
      res.status(200).json({ isTaken: !!vehicle });
    } catch (error) {
      console.error('Error checking plate:', error);
      res.status(500).json({ message: error.message || 'Failed to check plate.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

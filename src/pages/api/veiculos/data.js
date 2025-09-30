
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const clients = await dataService.getAllClients();
      const vehicles = await dataService.getAllVehicles();

      res.status(200).json({ clients, vehicles });
    } catch (error) {
      console.error('Error fetching veiculos data:', error);
      res.status(500).json({ message: error.message || 'Falha ao buscar dados de veículos.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      const os = await dataService.getOSById(id);

      if (!os) {
        return res.status(404).json({ message: 'OS não encontrada.' });
      }

      // Fetch client and vehicle details separately
      const client = await dataService.getClientById(os.client_id);
      const vehicle = await dataService.getVehicleById(os.vehicle_id);

      res.status(200).json({ os, client, vehicle });
    } catch (error) {
      console.error('Erro ao buscar dados da OS:', error);
      res.status(500).json({ message: error.message || 'Falha ao buscar dados da OS.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

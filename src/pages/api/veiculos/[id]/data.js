
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'ID do veículo é obrigatório.' });
    }

    try {
      const vehicle = await dataService.getVehicleById(id);

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found.' });
      }

      let client = null;
      if (vehicle.client_id) {
        client = await dataService.getClientById(vehicle.client_id);
      }

      const services = await dataService.getVehicleServicesPerformed(id);

      res.status(200).json({ vehicle, client, services });
    } catch (error) {
      console.error('Error fetching vehicle details data:', error);
      res.status(500).json({ message: error.message || 'Falha ao buscar dados de detalhes do veículo.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

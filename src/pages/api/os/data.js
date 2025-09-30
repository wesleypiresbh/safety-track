
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const { status } = req.query;

    try {
      const [fetchedClients, fetchedVehicles, fetchedOrcamentos] = await Promise.all([
        dataService.getAllClients(),
        dataService.getAllVehicles(),
        dataService.getAllOrcamentos(),
      ]);

      let fetchedOS;
      if (status) {
        fetchedOS = await dataService.getOSByStatus(status);
      } else {
        fetchedOS = await dataService.getAllOS();
      }

      // Enrich OS data with client and vehicle details
      const osWithDetails = fetchedOS.map((os) => {
        const client = fetchedClients.find(c => c.id === os.client_id);
        const vehicle = fetchedVehicles.find(v => v.id === os.vehicle_id);
        return {
          ...os,
          clientName: client ? client.name : 'Desconhecido',
          vehiclePlate: vehicle ? vehicle.plate : 'Desconhecido',
        };
      });

      res.status(200).json({ clients: fetchedClients, allVehicles: fetchedVehicles, ordensDeServico: osWithDetails, orcamentos: fetchedOrcamentos });
    } catch (error) {
      console.error('Erro ao buscar dados de OS:', error);
      res.status(500).json({ message: error.message || 'Falha ao buscar dados de OS.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

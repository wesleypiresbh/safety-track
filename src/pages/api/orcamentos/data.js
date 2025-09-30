
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const [clients, vehicles, services, orcamentos] = await Promise.all([
        dataService.getAllClients(),
        dataService.getAllVehicles(),
        dataService.getServices(),
        dataService.getAllOrcamentos(),
      ]);

      res.status(200).json({ clients, vehicles, services, orcamentos });
    } catch (error) {
      console.error('Erro ao buscar dados de orçamentos:', error);
      res.status(500).json({ message: error.message || 'Falha ao buscar dados de orçamentos.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

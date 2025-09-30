import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      const orcamento = await dataService.getOrcamentoById(id);

      if (!orcamento) {
        return res.status(404).json({ message: 'Orçamento não encontrado.' });
      }

      // Fetch client, vehicle, and services details for display
      const client = await dataService.getClientById(orcamento.cliente_id);
      const vehicle = await dataService.getVehicleById(orcamento.veiculo_id);
      const services = await dataService.getServices(); // All services for mapping
      const allClients = await dataService.getAllClients(); // Fetch all clients
      const allVehicles = await dataService.getAllVehicles(); // Fetch all vehicles

      res.status(200).json({ orcamento, client, vehicle, services, clients: allClients, vehicles: allVehicles });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Falha ao buscar dados do orçamento.' });
    }
  } else if (req.method === 'PUT') {
    const { id } = req.query;
    try {
      const updatedOrcamento = await dataService.updateOrcamento(id, req.body);
      res.status(200).json(updatedOrcamento);
    } catch (error) {
      res.status(500).json({ message: error.message || 'Falha ao atualizar orçamento.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);


import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { id, ...data } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'ID do veículo é obrigatório.' });
      }
      const updatedVehicle = await dataService.updateVehicleDetails(id, data);
      res.status(200).json(updatedVehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ message: error.message || 'Falha ao atualizar veículo.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

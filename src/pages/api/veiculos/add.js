
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { marca, modelo, ano, placa, clienteId } = req.body;
      const newVehicle = await dataService.addVehicle({
        make: marca,
        model: modelo,
        year: ano,
        plate: placa,
        client_id: clienteId,
      });
      res.status(201).json(newVehicle);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      res.status(500).json({ message: error.message || 'Falha ao adicionar veículo.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

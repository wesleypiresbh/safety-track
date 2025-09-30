
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const serviceData = { ...req.body };
      if (serviceData.price && typeof serviceData.price === 'string') {
        serviceData.price = parseFloat(serviceData.price.replace(',', '.'));
      }
      const newService = await dataService.addService(serviceData);
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error adding service:', error);
      res.status(500).json({ message: error.message || 'Falha ao adicionar serviço.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const companyInfo = await dataService.getCompanyInfo();
      res.status(200).json(companyInfo);
    } catch (error) {
      console.error('Error fetching company info:', error);
      res.status(500).json({ message: error.message || 'Falha ao buscar informações da empresa.' });
    }
  } else if (req.method === 'POST') {
    try {
      const updatedCompanyInfo = await dataService.updateCompanyInfo(req.body);
      res.status(200).json(updatedCompanyInfo);
    } catch (error) {
      console.error('Error updating company info:', error);
      res.status(500).json({ message: error.message || 'Falha ao atualizar informações da empresa.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

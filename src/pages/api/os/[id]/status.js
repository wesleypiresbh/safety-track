import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { status } = req.body;

    try {
      await dataService.updateOSStatus(id, status);
      res.status(200).json({ message: 'Status da OS atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar status da OS:', error);
      res.status(500).json({ message: error.message || 'Falha ao atualizar status da OS.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { custoPecas, custoMaoDeObra } = req.body;

    try {
      await dataService.updateOSCosts(id, custoPecas, custoMaoDeObra);
      res.status(200).json({ message: 'Custos da OS atualizados com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar custos da OS:', error);
      res.status(500).json({ message: error.message || 'Falha ao atualizar custos da OS.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

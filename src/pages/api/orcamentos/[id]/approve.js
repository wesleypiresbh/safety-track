import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.query; // orcamento ID

    try {
      const orcamento = await dataService.getOrcamentoById(id);

      if (!orcamento) {
        return res.status(404).json({ message: 'Orçamento não encontrado.' });
      }

      if (orcamento.status === 'Aprovado') {
        return res.status(400).json({ message: 'Orçamento já aprovado.' });
      }

      // 1. Atualizar o status do Orçamento para 'Aprovado'
      await dataService.updateOrcamentoStatus(id, 'Aprovado');

      res.status(200).json({ message: 'Orçamento aprovado com sucesso!' });

    } catch (error) {
      console.error('Erro ao aprovar orçamento e criar OS:', error);
      res.status(500).json({ message: error.message || 'Falha ao aprovar orçamento.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

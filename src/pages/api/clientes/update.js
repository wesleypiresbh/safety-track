
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { id, nome, email, telefone, endereco, cpfCnpj } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'ID do cliente é obrigatório.' });
      }

      // Map frontend names to database names
      const clientData = {
        name: nome,
        email: email,
        phone: telefone.replace(/\D/g, ''), // Remove mask before saving
        address: endereco,
        cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
      };

      const updatedClient = await dataService.updateClient(id, clientData);
      res.status(200).json(updatedClient);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ message: error.message || 'Falha ao atualizar cliente.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

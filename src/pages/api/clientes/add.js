
import { authMiddleware } from '@/middleware/authMiddleware';
import * as dataService from '@/services/dataService';

const handler = async (req, res) => {
  console.log('--- [API] /api/clientes/add handler started ---');
  if (req.method === 'POST') {
    try {
      const { nome, email, telefone, endereco, cpfCnpj } = req.body;
      const newClient = await dataService.addClient({
        name: nome,
        email: email,
        phone: telefone,
        address: endereco,
        cpf_cnpj: cpfCnpj,
      });
      res.status(201).json(newClient);
    } catch (error) {
      console.error('--- [API] CAUGHT ERROR in /api/clientes/add ---', error);
      res.status(500).json({ message: error.message || 'Falha ao adicionar cliente.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
  }
};

export default authMiddleware(handler);

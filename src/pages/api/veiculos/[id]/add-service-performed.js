
import { authMiddleware } from '@/middleware/authMiddleware';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.query; // Vehicle ID from URL
    const serviceData = req.body; // Service data from request body

    if (!id) {
      return res.status(400).json({ message: 'Vehicle ID is required.' });
    }

    try {
      // Map client-side data to database schema
      const response = await fetch(`${req.headers.origin}/api/db-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie, // Forward cookies for auth
        },
        body: JSON.stringify({
          functionName: 'addVehicleServicePerformed',
          args: [{
            vehicle_id: parseInt(id, 10),
            description: serviceData.descricao,
            value: serviceData.valor ? parseFloat(serviceData.valor) : null,
            date: new Date().toISOString(),
          }],
        }),
      });
      const newServiceRecord = await response.json();
      res.status(201).json(newServiceRecord);
    } catch (error) {
      console.error('Error adding service performed to vehicle:', error);
      res.status(500).json({ message: error.message || 'Falha ao adicionar serviço realizado ao veículo.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default authMiddleware(handler);

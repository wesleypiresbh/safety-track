import * as dataService from '@/services/dataService';
import { authMiddleware } from '@/middleware/authMiddleware';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { functionName, args } = req.body;

    if (!functionName || typeof dataService[functionName] !== 'function') {
      return res.status(400).json({ message: 'Invalid dataService function specified.' });
    }

    try {
      const result = await dataService[functionName](...args);
      res.status(200).json(result);
    } catch (error) {
      console.error(`Error executing dataService function ${functionName}:`, error);
      res.status(500).json({ message: error.message || `Failed to execute ${functionName}.` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default authMiddleware(handler);

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import FormInput from '@/components/FormInput';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { getServices } from '@/services/dataService';
import { formatCurrency } from '@/utils/helpers';

export default function Servicos({ services: initialServices }) { // Receive services as prop
  const [services, setServices] = useState(initialServices); // Initialize with fetched data
  const [visibleServices, setVisibleServices] = useState(5);
  const [newService, setNewService] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    notes: ''
  });
  const [message, setMessage] = useState('');

  const handleShowMore = () => {
    setVisibleServices(services.length);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
          // Client-side validation can go here if needed
              // No need to check ID uniqueness via API anymore as it's auto-generated
          
              try {
                const response = await fetch('/api/servicos/add', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(newService),
                });      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add service.');
      }

      // Update local state with the newly added service (including ID from DB)
      setServices(prev => [...prev, data]);
      setNewService({ id: '', name: '', description: '', price: '', notes: '' });
      setMessage('Serviço adicionado com sucesso!');
      // Optionally, reload page or refetch data for full consistency
    } catch (error) {
      console.error('Error adding service:', error);
      setMessage(`Erro ao adicionar serviço: ${error.message}`);
      // Display error message to user
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Serviços</h1>

      <div className="mb-8 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">Adicionar Novo Serviço</h2>
        <form onSubmit={handleAddService} className="space-y-4">

          <FormInput type="text" name="name" placeholder="Nome do Serviço" value={newService.name} onChange={handleInputChange} />
          <FormInput type="text" name="description" placeholder="Descrição" value={newService.description} onChange={handleInputChange} />
          <FormInput type="text" name="price" placeholder="Preço" value={newService.price} onChange={handleInputChange} />
          <FormInput type="text" name="notes" placeholder="Observações" value={newService.notes} onChange={handleInputChange} />
          <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Adicionar Serviço</Button>
        </form>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Tabela de Serviços</h2>
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Código</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descrição</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Preço</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Observações</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {services.slice(0, visibleServices).map((service) => (
              <tr key={service.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{service.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{service.name}</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-300">{service.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(service.price)}</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-300">{service.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleServices < services.length && (
          <div className="mt-4 text-center">
            <Button onClick={handleShowMore} className="bg-gray-700 hover:bg-gray-600 text-white">Ver mais</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const fetchedServices = await getServices(); // Fetch services from DB

    return {
      props: {
        services: fetchedServices,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching data for Servicos:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}
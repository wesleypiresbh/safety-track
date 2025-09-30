import React, { useState } from 'react'; // useEffect removed
import { useRouter } from 'next/router';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const serviceSchema = z.object({
  descricao: z.string().min(5, 'Descrição é obrigatória e deve ter pelo menos 5 caracteres.'),
  valor: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Valor não pode ser negativo.').optional()
  ),
});

export default function VehicleDetails({ vehicle, client, services }) { // Receive data as props
  const router = useRouter();
  const { id } = router.query;

  // State for the vehicle edit form
  const [vehicleFormData, setVehicleFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate: vehicle.plate,
  });
  const [vehicleErrors, setVehicleErrors] = useState({});

  // State for the add service form
  const [serviceFormData, setServiceFormData] = useState({
    descricao: '',
    valor: '',
  });
  const [serviceErrors, setServiceErrors] = useState({});
  const [message, setMessage] = useState('');

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    setMessage('');
    setVehicleErrors({});

    try {
      // TODO: Add Zod validation for vehicle form

      const response = await fetch('/api/veiculos/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          ...vehicleFormData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update vehicle.');
      }

      setMessage('Veículo atualizado com sucesso!');
      // Optionally, you can update the initial `vehicle` prop if needed
      // or just show a success message.

    } catch (error) {
      // TODO: Handle Zod errors
      setMessage(`Erro ao atualizar veículo: ${error.message}`);
    }
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setMessage('');
    setServiceErrors({});

    try {
      const validatedData = serviceSchema.parse(serviceFormData);
      
      const response = await fetch(`/api/veiculos/${id}/add-service-performed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descricao: validatedData.descricao,
          valor: validatedData.valor,
          date: new Date().toISOString(), // Pass current date
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add service.');
      }

      setMessage('Atendimento adicionado com sucesso!');
      setServiceFormData({ descricao: '', valor: '', });
      // For dynamic updates without full page reload, consider SWR or similar client-side data fetching.
      // For now, a page reload might be needed to see the updated list.
      router.reload(); // Reload the page to fetch updated services
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setServiceErrors(newErrors);
      } else {
        setMessage(`Erro ao adicionar atendimento: ${error.message}`);
      }
    }
  };

  if (!vehicle) {
    return (
      <Layout> {/* Wrap with Layout */}
        <p>Carregando...</p>
      </Layout>
    );
  }

  return (
    <Layout> {/* Wrap with Layout */}
      <h1 className="text-3xl font-bold mb-6">Detalhes do Veículo</h1>
      
      <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl font-semibold mb-4">Informações do Veículo</h2>
        <p className="mb-4"><strong>Cliente:</strong> {client.name} ({client.cpf_cnpj})</p>
        <form onSubmit={handleUpdateVehicle} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label htmlFor="make" className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
              <FormInput
                id="make"
                type="text"
                name="make"
                value={vehicleFormData.make}
                onChange={handleVehicleChange}
              />
              {/* TODO: Add error display */}
            </div>
            <div className="w-1/2">
              <label htmlFor="model" className="block text-sm font-medium text-gray-400 mb-1">Modelo</label>
              <FormInput
                id="model"
                type="text"
                name="model"
                value={vehicleFormData.model}
                onChange={handleVehicleChange}
              />
              {/* TODO: Add error display */}
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label htmlFor="year" className="block text-sm font-medium text-gray-400 mb-1">Ano</label>
              <FormInput
                id="year"
                type="number"
                name="year"
                value={vehicleFormData.year}
                onChange={handleVehicleChange}
              />
              {/* TODO: Add error display */}
            </div>
            <div className="w-1/2">
              <label htmlFor="plate" className="block text-sm font-medium text-gray-400 mb-1">Placa</label>
              <FormInput
                id="plate"
                type="text"
                name="plate"
                value={vehicleFormData.plate}
                onChange={handleVehicleChange}
              />
              {/* TODO: Add error display */}
            </div>
          </div>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Salvar Alterações
          </Button>
        </form>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl font-semibold mb-4">Adicionar Atendimento</h2>
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <FormInput
              type="text"
              name="descricao"
              placeholder="Descrição do Atendimento"
              value={serviceFormData.descricao}
              onChange={handleServiceChange}
            />
            {serviceErrors.descricao && <p className="text-red-500 text-sm mt-1">{serviceErrors.descricao}</p>}
          </div>
          <div>
            <FormInput
              type="number"
              name="valor"
              placeholder="Valor (opcional)"
              value={serviceFormData.valor}
              onChange={handleServiceChange}
            />
            {serviceErrors.valor && <p className="text-red-500 text-sm mt-1">{serviceErrors.valor}</p>}
          </div>
          <Button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Adicionar Atendimento
          </Button>
        </form>
        {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Histórico de Atendimentos</h2>
        {services.length === 0 ? (
          <p>Nenhum atendimento registrado para este veículo.</p>
        ) : (
          <ul>
            {services.map((service) => (
              <li key={service.id} className="mb-4 p-4 border border-gray-700 rounded">
                <p><strong>Data:</strong> {new Date(service.date).toLocaleString()}</p>
                <p><strong>Descrição:</strong> {service.description}</p>
                {service.value !== undefined && <p><strong>Valor:</strong> R$ {service.value.toFixed(2)}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout> // Close Layout
  );
}

import * as dataService from '@/services/dataService';

export async function getServerSideProps(context) {
  const { req, query } = context;
  const { id } = query;
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

    const vehicle = await dataService.getVehicleById(id);

    if (!vehicle) {
      return {
        notFound: true,
      };
    }

    let client = null;
    if (vehicle.client_id) {
      client = await dataService.getClientById(vehicle.client_id);
    }

    const services = await dataService.getVehicleServicesPerformed(id);

    return {
      props: {
        vehicle,
        client,
        services,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching data for Vehicle Details:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}
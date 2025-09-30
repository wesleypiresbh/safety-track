import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { useRouter } from 'next/router';
import { formatCurrency } from '@/utils/helpers';

const orcamentoSchema = z.object({
  dataOrcamento: z.string().min(1, 'Data é obrigatória.'),
  clienteId: z.string().min(1, 'Cliente é obrigatório.'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório.'),
  km: z.string().min(1, 'KM é obrigatório.'),
  servicos: z.array(z.string()).min(1, 'Pelo menos um serviço é obrigatório.'),
  pecas: z.array(z.object({
    name: z.string().min(1, 'Nome da peça é obrigatório.'),
    value: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().min(0, 'Valor da peça deve ser um número positivo.')
    ),
  })).optional(),
});

export default function OrcamentoEditPage({ orcamento, clients, vehicles, services }) {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    clienteId: '',
    veiculoId: '',
    km: '',
    servicos: [],
    pecas: [], // Changed to array
  });

  useEffect(() => {
    if (orcamento) {
      setFormData({
        clienteId: String(orcamento.cliente_id),
        veiculoId: String(orcamento.veiculo_id),
        km: orcamento.km,
        servicos: orcamento.servicos,
        pecas: orcamento.pecas,
      });
    }
  }, [orcamento]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [dataOrcamento, setDataOrcamento] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newPartName, setNewPartName] = useState('');
  const [newPartValue, setNewPartValue] = useState('');
  const [calculatedTotalValue, setCalculatedTotalValue] = useState(0);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDataOrcamento(`${year}-${month}-${day}`);
    setDisplayDate(`${day}/${month}/${year}`);
  }, []);

  useEffect(() => {
    const totalServices = formData.servicos.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return sum + (service ? parseFloat(service.price) : 0);
    }, 0);

    const totalParts = formData.pecas.reduce((sum, part) => sum + part.value, 0);

    setCalculatedTotalValue(totalServices + totalParts);
  }, [formData.servicos, formData.pecas, services]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clienteId') {
      setFormData((prev) => ({ ...prev, [name]: value, veiculoId: '' })); // Reset vehicle when client changes
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    setFormData((prev) => {
      // Only add if not already included
      if (!prev.servicos.includes(serviceId)) {
        return { ...prev, servicos: [...prev.servicos, serviceId] };
      }
      return prev; // If already included, return previous state
    });
    e.target.value = ""; // Reset the select input
  };

  const handleAddPart = () => {
    if (newPartName.trim() === '' || isNaN(parseFloat(newPartValue))) {
      setMessage('Por favor, insira um nome e um valor válido para a peça.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      pecas: [...prev.pecas, { name: newPartName, value: parseFloat(newPartValue) }]
    }));
    setNewPartName('');
    setNewPartValue('');
    setMessage('');
  };

  const handleRemovePart = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      pecas: prev.pecas.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      const dataToValidate = { ...formData, dataOrcamento };
      orcamentoSchema.parse(dataToValidate);

      const response = await fetch(`/api/orcamentos/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...formData, dataOrcamento, valorOrcamento: calculatedTotalValue }),
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update orcamento.');
      }

      setMessage('Orçamento atualizado com sucesso!');
      router.push(`/orcamentos/${id}`);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setErrors(newErrors);
      } else {
        setMessage(`Erro ao atualizar orçamento: ${error.message}`);
      }
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => vehicle.client_id === parseInt(formData.clienteId));

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Editar Orçamento</h1>
      </div>

      {message && <p className="text-green-500 my-4 text-center">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nº do Orçamento</label>
            <FormInput type="text" name="numeroOrcamento" placeholder="Gerado Automaticamente" value={orcamento.numero_orcamento} readOnly disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
            <FormInput type="text" name="dataOrcamento" value={displayDate} readOnly disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">KM Atual</label>
            <FormInput type="number" name="km" placeholder="KM Atual" value={formData.km} onChange={handleChange} />
            {errors.km && <p className="text-red-500 text-sm mt-1">{errors.km}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Cliente</label>
            <select name="clienteId" className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white" value={formData.clienteId} onChange={handleChange}>
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            {errors.clienteId && <p className="text-red-500 text-sm mt-1">{errors.clienteId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Veículo</label>
            <select name="veiculoId" className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white" value={formData.veiculoId} onChange={handleChange}>
              <option value="">Selecione um veículo</option>
              {filteredVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} - {vehicle.plate}</option>
              ))}
            </select>
            {errors.veiculoId && <p className="text-red-500 text-sm mt-1">{errors.veiculoId}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Adicionar Serviço</label>
          <select
            name="serviceId"
            className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white"
            value="" // Controlled component, reset value after selection
            onChange={handleServiceChange}
          >
            <option value="">Selecione um serviço</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - {formatCurrency(service.price)}
              </option>
            ))}
          </select>
          {errors.servicos && <p className="text-red-500 text-sm mt-1">{errors.servicos}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Serviços Selecionados</label>
          <div className="w-full p-2 border border-gray-700 rounded bg-gray-900 min-h-[42px] flex flex-wrap gap-2">
            {formData.servicos.length > 0 ? (
              formData.servicos.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return service ? (
                  <span key={service.id} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm flex items-center">
                    {service.name}
                    <button type="button" onClick={() => handleServiceChange(service.id)} className="ml-2 text-red-400 hover:text-red-600 font-bold">&times;</button>
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-gray-500 text-sm p-2">Nenhum serviço adicionado.</span>
            )}
          </div>
          {errors.servicos && <p className="text-red-500 text-sm mt-1">{errors.servicos}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Adicionar Peça</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <FormInput
              type="text"
              name="newPartName"
              placeholder="Nome da Peça"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
            />
            <FormInput
              type="number"
              name="newPartValue"
              placeholder="Valor"
              value={newPartValue}
              onChange={(e) => setNewPartValue(e.target.value)}
            />
            <Button type="button" onClick={handleAddPart} className="bg-blue-600 hover:bg-blue-700 text-white">
              Adicionar Peça
            </Button>
          </div>
          <div className="w-full p-2 border border-gray-700 rounded bg-gray-900 min-h-[42px] flex flex-wrap gap-2">
            {formData.pecas.length > 0 ? (
              formData.pecas.map((part, index) => (
                <span key={index} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  {part.name} - {formatCurrency(part.value)}
                  <button type="button" onClick={() => handleRemovePart(index)} className="ml-2 text-red-400 hover:text-red-600 font-bold">&times;</button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm p-2">Nenhuma peça adicionada.</span>
            )}
          </div>
          {errors.pecas && <p className="text-red-500 text-sm mt-1">{errors.pecas}</p>}
        </div>

        <div className="text-right text-white text-xl font-bold mt-4">
          Valor Total do Orçamento: {formatCurrency(calculatedTotalValue)}
        </div>
        
        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded">
          Salvar Alterações
        </Button>
      </form>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req, params } = context;
  const { id } = params;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/orcamentos/${id}`;

    const response = await fetch(apiUrl, {
      headers: { Cookie: `token=${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orcamento data: ${response.statusText}`);
    }

    const { orcamento, clients, vehicles, services } = await response.json();

    return {
      props: {
        orcamento,
        clients,
        vehicles,
        services,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching data for Orcamentos:', error);
    return { redirect: { destination: '/', permanent: false } };
  }
}

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import Link from 'next/link'; // Import Link
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { useRouter } from 'next/router';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const osSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório.'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório.'),
  km: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().int().min(0, 'KM deve ser um número positivo.')
  ),
  combustivel: z.string().min(1, 'Nível de combustível é obrigatório.'),
  observacoes: z.string().min(5, 'Observações são obrigatórias e devem ter pelo menos 5 caracteres.'),
  custoPecas: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Custo de Peças não pode ser negativo.').optional()
  ).optional(),
  custoMaoDeObra: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Custo de Mão de Obra não pode ser negativo.').optional()
  ).optional(),
  services_ids: z.array(z.string()).optional(),
});

export default function AberturaOS() { // Receive data as props
  const router = useRouter();
  const [formData, setFormData] = useState({
    clienteId: '',
    veiculoId: '',
    km: '',
    combustivel: '',
    observacoes: '',
  });
  const [clients, setClients] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [ordensDeServico, setOrdensDeServico] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState(''); // New state for selected budget ID

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/os/data');
        if (!response.ok) {
          throw new Error('Failed to fetch OS data');
        }
        const { clients, allVehicles, ordensDeServico, orcamentos } = await response.json();
        setClients(clients);
        setAllVehicles(allVehicles);
        setOrdensDeServico(ordensDeServico);
        setOrcamentos(orcamentos.filter(o => o.status === 'Aprovado').map(o => ({ ...o, pecas: o.pecas || [] })));
      } catch (error) {
        console.error('Error fetching data for OS:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.clienteId) {
      setFilteredVehicles(allVehicles.filter(v => v.client_id === formData.clienteId)); // Adjusted to client_id
    } else {
      setFilteredVehicles([]);
    }
  }, [formData.clienteId, allVehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'km' ? (value ? parseInt(value, 10) : '') : value,
    }));
  };

  const handleOrcamentoChange = (e) => {
    const orcamentoId = e.target.value;
    setSelectedOrcamentoId(orcamentoId);

    if (orcamentoId) {
      const selectedOrcamento = orcamentos.find(o => o.id === parseInt(orcamentoId));
      console.log('Selected Orcamento ID:', orcamentoId);
      console.log('Selected Orcamento:', selectedOrcamento);

      if (selectedOrcamento) {
        // Calculate custoPecas and custoMaoDeObra
        const custoPecas = selectedOrcamento.pecas.reduce((sum, peca) => sum + peca.value, 0);
        const custoMaoDeObra = selectedOrcamento.valorOrcamento - custoPecas;

        const foundClient = clients.find(c => c.id === selectedOrcamento.cliente_id);
        const foundVehicle = allVehicles.find(v => v.id === Number(selectedOrcamento.veiculo_id));

        console.log('Orcamento cliente_id:', selectedOrcamento.cliente_id);
        console.log('Found Client:', foundClient);
        console.log('Orcamento veiculo_id:', selectedOrcamento.veiculo_id);
        console.log('All Vehicles:', allVehicles);
        console.log('Found Vehicle:', foundVehicle);

        setFormData({
          clienteId: String(selectedOrcamento.cliente_id),
          veiculoId: String(selectedOrcamento.veiculo_id),
          km: selectedOrcamento.km,
          combustivel: '', // Budget doesn't have fuel level, so keep it empty or set a default
          observacoes: selectedOrcamento.descricao || `OS gerada a partir do Orçamento Nº ${selectedOrcamento.numero_orcamento}`,
          custoPecas: custoPecas,
          custoMaoDeObra: custoMaoDeObra,
          services_ids: selectedOrcamento.servicos,
        });
        setErrors({}); // Clear any previous errors
      }
    } else {
      // Reset form if no budget is selected
      setFormData({
        clienteId: '',
        veiculoId: '',
        km: '',
        combustivel: '',
        observacoes: '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      const validatedData = osSchema.parse(formData);
      const dataToSend = { 
        ...validatedData, 
        client_id: validatedData.clienteId, 
        vehicle_id: validatedData.veiculoId, 
        status: 'Em Andamento',
        description: validatedData.observacoes,
        combustivel: validatedData.combustivel,
        custo_pecas: validatedData.custoPecas,
        custo_mao_de_obra: validatedData.custoMaoDeObra,
        total_price: (validatedData.custoPecas || 0) + (validatedData.custoMaoDeObra || 0)
      };
      delete dataToSend.clienteId;
      delete dataToSend.veiculoId;
      delete dataToSend.observacoes;
      delete dataToSend.custoPecas;
      delete dataToSend.custoMaoDeObra;
      
      const response = await fetch('/api/os/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add OS.');
      }

      setMessage('Ordem de Serviço aberta com sucesso!');
      router.push(`/os/${data.id}`); // Redirect to the new OS page
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setErrors(newErrors);
      } else {
        setMessage(`Erro ao abrir OS: ${error.message}`);
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Em Andamento':
        return 'text-blue-600';
      case 'Concluída':
        return 'text-green-600';
      case 'Cancelada':
        return 'text-red-600';
      default:
        return 'text-gray-300';
    }
  };

  const clientName = selectedOrcamentoId
    ? clients.find(c => c.id === Number(formData.clienteId))?.name || ''
    : '';

  const vehicleDetails = selectedOrcamentoId
    ? allVehicles.find(v => v.id === Number(formData.veiculoId))?.make + ' ' +
      allVehicles.find(v => v.id === Number(formData.veiculoId))?.model + ' (' +
      allVehicles.find(v => v.id === Number(formData.veiculoId))?.plate + ')' || ''
    : '';

  return (
    <Layout> {/* Wrap with Layout */}
      <h1 className="text-3xl font-bold mb-6">Abertura de Ordem de Serviço</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto mb-8">
        {/* Select Budget */}
        <div>
          <label htmlFor="orcamentoId" className="block text-sm font-medium text-gray-400 mb-1">Selecionar Orçamento</label>
          <select
            id="orcamentoId"
            name="orcamentoId"
            value={selectedOrcamentoId}
            onChange={handleOrcamentoChange}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">-- Selecione um Orçamento --</option>
            {orcamentos.map((orcamento) => (
              <option key={orcamento.id} value={orcamento.id}>
                Orçamento Nº {orcamento.numero_orcamento} - {orcamento.client_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="clienteId" className="block text-sm font-medium text-gray-400 mb-1">Cliente</label>
          {selectedOrcamentoId ? (
            <FormInput
              type="text"
              name="clienteName"
              value={(() => {
                console.log('Rendering Client FormInput. formData.clienteId:', formData.clienteId);
                const client = clients.find(c => c.id === Number(formData.clienteId));
                console.log('Client found for rendering:', client);
                return client?.name || '';
              })()}
              readOnly
              disabled
            />
          ) : (
            <select
              id="clienteId"
              name="clienteId"
              value={formData.clienteId}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.cpf_cnpj})
                </option>
              ))}
            </select>
          )}
          {errors.clienteId && <p className="text-red-500 text-sm mt-1">{errors.clienteId}</p>}
        </div>

        <div>
          <label htmlFor="veiculoId" className="block text-sm font-medium text-gray-400 mb-1">Veículo</label>
          {selectedOrcamentoId ? (
            <FormInput
              type="text"
              name="vehicleName"
              value={(() => {
                console.log('Rendering Vehicle FormInput. formData.veiculoId:', formData.veiculoId);
                const vehicle = allVehicles.find(v => v.id === Number(formData.veiculoId));
                console.log('Vehicle found for rendering:', vehicle);
                return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : '';
              })()}
              readOnly
              disabled
            />
          ) : (
            <select
              id="veiculoId"
              name="veiculoId"
              value={formData.veiculoId}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
              disabled={!formData.clienteId}
            >
              <option value="">Selecione um veículo</option>
              {filteredVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.plate})
                </option>
              ))}
            </select>
          )}
          {errors.veiculoId && <p className="text-red-500 text-sm mt-1">{errors.veiculoId}</p>}
        </div>
        
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label htmlFor="km" className="block text-sm font-medium text-gray-400 mb-1">Kilometragem</label>
            <FormInput
              id="km"
              type="number"
              name="km"
              placeholder="KM"
              value={formData.km}
              onChange={handleChange}
            />
            {errors.km && <p className="text-red-500 text-sm mt-1">{errors.km}</p>}
          </div>
          <div className="w-1/2">
            <label htmlFor="combustivel" className="block text-sm font-medium text-gray-400 mb-1">Combustível</label>
            <select
              id="combustivel"
              name="combustivel"
              value={formData.combustivel}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecione</option>
              <option value="1/4">1/4</option>
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
            </select>
            {errors.combustivel && <p className="text-red-500 text-sm mt-1">{errors.combustivel}</p>}
          </div>
        </div>
        
        <div>
          <FormInput
            type="text"
            name="observacoes"
            placeholder="Observações"
            value={formData.observacoes}
            onChange={handleChange}
          />
          {errors.observacoes && <p className="text-red-500 text-sm mt-1">{errors.observacoes}</p>}
        </div>
        
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Abrir OS
        </Button>
      </form>

      {message && <p className="text-green-500 mt-4 text-center">{message}</p>}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Ordens de Serviço Abertas</h2>
        {ordensDeServico.length === 0 ? (
          <p>Nenhuma Ordem de Serviço aberta.</p>
        ) : (
          <ul className="space-y-4">
            {ordensDeServico.map((os) => (
              <li key={os.id} className="bg-gray-900 p-4 rounded-lg shadow-xl flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">OS #{os.id}</p>
                  <p className="text-sm text-gray-400">Cliente: {os.clientName}</p>
                  <p className="text-sm text-gray-400">Veículo: {os.vehiclePlate}</p>
                  <p className={`text-sm font-bold ${getStatusClass(os.status)}`}>Status: {os.status}</p>
                </div>
                <Link href={`/os/${os.id}`} className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded transition duration-200">
                  Ver Detalhes
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout> // Close Layout
  );
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { getVehicleById, getServicesByVehicleId, addService, getClientById } from '@/services/firestoreService';

const serviceSchema = z.object({
  descricao: z.string().min(5, 'Descrição é obrigatória e deve ter pelo menos 5 caracteres.'),
  valor: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Valor não pode ser negativo.').optional()
  ),
});

export default function VehicleDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceFormData, setServiceFormData] = useState({
    descricao: '',
    valor: '',
  });
  const [serviceErrors, setServiceErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      const fetchVehicleData = async () => {
        try {
          const fetchedVehicle = await getVehicleById(id);
          setVehicle(fetchedVehicle);

          if (fetchedVehicle && fetchedVehicle.clienteId) {
            const fetchedClient = await getClientById(fetchedVehicle.clienteId);
            setClient(fetchedClient);
          }

          const fetchedServices = await getServicesByVehicleId(id);
          setServices(fetchedServices);
        } catch (error) {
          console.error('Error fetching vehicle data:', error);
          setMessage('Erro ao carregar dados do veículo.');
        }
      };
      fetchVehicleData();
    }
  }, [id]);

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
      
      await addService({
        veiculoId: id,
        data: new Date().toISOString(), // Store as ISO string
        descricao: validatedData.descricao,
        valor: validatedData.valor || 0, // Default to 0 if optional and not provided
      });
      setMessage('Atendimento adicionado com sucesso!');
      setServiceFormData({ descricao: '', valor: '', });
      // Refresh services list
      const updatedServices = await getServicesByVehicleId(id);
      setServices(updatedServices);
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
        <p><strong>Marca:</strong> {vehicle.marca}</p>
        <p><strong>Modelo:</strong> {vehicle.modelo}</p>
        <p><strong>Ano:</strong> {vehicle.ano}</p>
        <p><strong>Placa:</strong> {vehicle.placa}</p>
        {client && <p><strong>Cliente:</strong> {client.nome} ({client.cpfCnpj})</p>}
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
                <p><strong>Data:</strong> {new Date(service.data).toLocaleString()}</p>
                <p><strong>Descrição:</strong> {service.descricao}</p>
                {service.valor !== undefined && <p><strong>Valor:</strong> R$ {service.valor.toFixed(2)}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout> // Close Layout
  );
}
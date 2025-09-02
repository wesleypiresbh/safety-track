import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import Link from 'next/link'; // Import Link
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { addOS, getClients, getVehicles, getOS, getClientById, getVehicleById } from '@/services/firestoreService'; // Import getOS, getClientById, getVehicleById

const osSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório.'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório.'),
  km: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().int().min(0, 'KM deve ser um número positivo.')
  ),
  observacoes: z.string().min(5, 'Observações são obrigatórias e devem ter pelo menos 5 caracteres.'),
});

export default function AberturaOS() {
  const [formData, setFormData] = useState({
    clienteId: '',
    veiculoId: '',
    km: '',
    observacoes: '',
  });
  const [clients, setClients] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [ordensDeServico, setOrdensDeServico] = useState([]); // New state for OS
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedClients = await getClients();
        setClients(fetchedClients);
        const fetchedVehicles = await getVehicles();
        setAllVehicles(fetchedVehicles);
        const fetchedOS = await getOS(); // Fetch OS
        
        // Fetch client and vehicle details for each OS
        const osWithDetails = await Promise.all(fetchedOS.map(async (os) => {
          const client = fetchedClients.find(c => c.id === os.clienteId);
          const vehicle = fetchedVehicles.find(v => v.id === os.veiculoId);
          return {
            ...os,
            clientName: client ? client.nome : 'Desconhecido',
            vehiclePlate: vehicle ? vehicle.placa : 'Desconhecido',
          };
        }));
        setOrdensDeServico(osWithDetails);

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Erro ao carregar dados.');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.clienteId) {
      setFilteredVehicles(allVehicles.filter(v => v.clienteId === formData.clienteId));
    } else {
      setFilteredVehicles([]);
    }
    setFormData(prev => ({ ...prev, veiculoId: '' })); // Reset vehicle when client changes
  }, [formData.clienteId, allVehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'km' ? (value ? parseInt(value, 10) : '') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      const validatedData = osSchema.parse(formData);
      
      await addOS(validatedData);
      setMessage('Ordem de Serviço aberta com sucesso!');
      setFormData({
        clienteId: '',
        veiculoId: '',
        km: '',
        observacoes: '',
      });
      // Refresh OS list
      const updatedOS = await getOS();
      const osWithDetails = await Promise.all(updatedOS.map(async (os) => {
        const client = clients.find(c => c.id === os.clienteId);
        const vehicle = allVehicles.find(v => v.id === os.veiculoId);
        return {
          ...os,
          clientName: client ? client.nome : 'Desconhecido',
          vehiclePlate: vehicle ? vehicle.placa : 'Desconhecido',
        };
      }));
      setOrdensDeServico(osWithDetails);
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

  return (
    <Layout> {/* Wrap with Layout */}
      <h1 className="text-3xl font-bold mb-6">Abertura de Ordem de Serviço</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto mb-8">
        <div>
          <label htmlFor="clienteId" className="block text-sm font-medium text-gray-400 mb-1">Cliente</label>
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
                {client.nome} ({client.cpfCnpj})
              </option>
            ))}
          </select>
          {errors.clienteId && <p className="text-red-500 text-sm mt-1">{errors.clienteId}</p>}
        </div>
        
        <div>
          <label htmlFor="veiculoId" className="block text-sm font-medium text-gray-400 mb-1">Veículo</label>
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
                {vehicle.marca} {vehicle.modelo} ({vehicle.placa})
              </option>
            ))}
          </select>
          {errors.veiculoId && <p className="text-red-500 text-sm mt-1">{errors.veiculoId}</p>}
        </div>
        
        <div>
          <FormInput
            type="number"
            name="km"
            placeholder="KM"
            value={formData.km}
            onChange={handleChange}
          />
          {errors.km && <p className="text-red-500 text-sm mt-1">{errors.km}</p>}
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
                  <p className="text-lg font-semibold">OS #{os.id.substring(0, 6)}</p>
                  <p className="text-sm text-gray-400">Cliente: {os.clientName}</p>
                  <p className="text-sm text-gray-400">Veículo: {os.vehiclePlate}</p>
                  <p className="text-sm text-gray-400">Status: {os.status}</p>
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
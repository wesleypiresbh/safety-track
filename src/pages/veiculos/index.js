import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import Link from 'next/link'; // Import Link
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { addVehicle, getVehicleByPlate, getClients, getVehicles } from '@/services/firestoreService'; // Import getVehicles

const vehicleSchema = z.object({
  marca: z.string().min(2, 'Marca é obrigatória e deve ter pelo menos 2 caracteres.'),
  modelo: z.string().min(2, 'Modelo é obrigatório e deve ter pelo menos 2 caracteres.'),
  ano: z.number().int().min(1900, 'Ano inválido.').max(new Date().getFullYear(), 'Ano não pode ser futuro.'),
  placa: z.string().regex(/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, 'Placa inválida (formato AAA1234 ou AAA1A23).'),
  clienteId: z.string().min(1, 'Cliente é obrigatório.'),
});

export default function Veiculos() {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    clienteId: '',
  });
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]); // New state for vehicles
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedClients = await getClients();
        setClients(fetchedClients);
        const fetchedVehicles = await getVehicles(); // Fetch vehicles
        setVehicles(fetchedVehicles);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Erro ao carregar dados.');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'ano' ? (value ? parseInt(value, 10) : '') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      // Validate with Zod
      vehicleSchema.parse(formData);

      // Check plate uniqueness
      const isPlateTaken = await getVehicleByPlate(formData.placa);
      if (isPlateTaken) {
        setErrors({ placa: 'Placa já cadastrada.' });
        return;
      }

      await addVehicle(formData);
      setMessage('Veículo cadastrado com sucesso!');
      setFormData({
        marca: '',
        modelo: '',
        ano: '',
        placa: '',
        clienteId: '',
      });
      const updatedVehicles = await getVehicles(); // Refresh vehicles list
      setVehicles(updatedVehicles);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setErrors(newErrors);
      } else {
        setMessage(`Erro ao cadastrar veículo: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Cadastro de Veículos</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto mb-8">
        <div>
          <FormInput
            type="text"
            name="marca"
            placeholder="Marca"
            value={formData.marca}
            onChange={handleChange}
          />
          {errors.marca && <p className="text-red-500 text-sm mt-1">{errors.marca}</p>}
        </div>
        
        <div>
          <FormInput
            type="text"
            name="modelo"
            placeholder="Modelo"
            value={formData.modelo}
            onChange={handleChange}
          />
          {errors.modelo && <p className="text-red-500 text-sm mt-1">{errors.modelo}</p>}
        </div>
        
        <div>
          <FormInput
            type="number"
            name="ano"
            placeholder="Ano"
            value={formData.ano}
            onChange={handleChange}
          />
          {errors.ano && <p className="text-red-500 text-sm mt-1">{errors.ano}</p>}
        </div>
        
        <div>
          <FormInput
            type="text"
            name="placa"
            placeholder="Placa (ex: ABC1234 ou ABC1A23)"
            value={formData.placa}
            onChange={handleChange}
          />
          {errors.placa && <p className="text-red-500 text-sm mt-1">{errors.placa}</p>}
        </div>
        
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
        
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Cadastrar Veículo
        </Button>
      </form>

      {message && <p className="text-green-500 mt-4 text-center">{message}</p>}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Veículos Cadastrados</h2>
        {vehicles.length === 0 ? (
          <p>Nenhum veículo cadastrado.</p>
        ) : (
          <ul className="space-y-4">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id} className="bg-gray-900 p-4 rounded-lg shadow-xl flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{vehicle.marca} {vehicle.modelo} ({vehicle.placa})</p>
                  <p className="text-sm text-gray-400">Ano: {vehicle.ano}</p>
                </div>
                <Link href={`/veiculos/${vehicle.id}`} className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded transition duration-200">
                  Ver Detalhes
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { getOSById, updateOSStatus, updateOSCosts, getClientById, getVehicleById } from '@/services/firestoreService';

const costSchema = z.object({
  custoPecas: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Custo de Peças não pode ser negativo.').optional()
  ),
  custoMaoDeObra: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Custo de Mão de Obra não pode ser negativo.').optional()
  ),
});

export default function OSDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [os, setOs] = useState(null);
  const [client, setClient] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [costFormData, setCostFormData] = useState({
    custoPecas: '',
    custoMaoDeObra: '',
  });
  const [costErrors, setCostErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      const fetchOSData = async () => {
        try {
          const fetchedOS = await getOSById(id);
          setOs(fetchedOS);

          if (fetchedOS) {
            // Fetch client and vehicle details
            const fetchedClient = await getClientById(fetchedOS.clienteId);
            setClient(fetchedClient);
            const fetchedVehicle = await getVehicleById(fetchedOS.veiculoId);
            setVehicle(fetchedVehicle);

            // Set initial cost form data if available
            setCostFormData({
              custoPecas: fetchedOS.custoPecas || '',
              custoMaoDeObra: fetchedOS.custoMaoDeObra || '',
            });
          }
        } catch (error) {
          console.error('Error fetching OS data:', error);
          setMessage('Erro ao carregar dados da OS.');
        }
      };
      fetchOSData();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateOSStatus(id, newStatus);
      setOs((prev) => ({ ...prev, status: newStatus }));
      setMessage(`Status da OS atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage(`Erro ao atualizar status: ${error.message}`);
    }
  };

  const handleCostChange = (e) => {
    const { name, value } = e.target;
    setCostFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCostUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setCostErrors({});

    try {
      const validatedData = costSchema.parse(costFormData);
      
      await updateOSCosts(id, validatedData.custoPecas, validatedData.custoMaoDeObra);
      setOs((prev) => ({
        ...prev,
        custoPecas: validatedData.custoPecas,
        custoMaoDeObra: validatedData.custoMaoDeObra,
        custoTotal: (validatedData.custoPecas || 0) + (validatedData.custoMaoDeObra || 0),
        dataConclusao: new Date().toISOString(), // Update conclusion date
      }));
      setMessage('Custos da OS atualizados com sucesso!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setCostErrors(newErrors);
      } else {
        setMessage(`Erro ao atualizar custos: ${error.message}`);
      }
    }
  };

  if (!os) {
    return (
      <Layout> {/* Wrap with Layout */}
        <p>Carregando...</p>
      </Layout>
    );
  }

  return (
    <Layout> {/* Wrap with Layout */}
      <h1 className="text-3xl font-bold mb-6">Detalhes da Ordem de Serviço #{id}</h1>
      
      <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl font-semibold mb-4">Informações da OS</h2>
        <p><strong>Status:</strong> {os.status}</p>
        <p><strong>Data de Abertura:</strong> {new Date(os.dataAbertura).toLocaleString()}</p>
        <p><strong>KM:</strong> {os.km}</p>
        <p><strong>Observações:</strong> {os.observacoes}</p>
        {client && <p><strong>Cliente:</strong> {client.nome} ({client.cpfCnpj})</p>}
        {vehicle && <p><strong>Veículo:</strong> {vehicle.marca} {vehicle.modelo} ({vehicle.placa})</p>}
        {os.dataConclusao && <p><strong>Data de Conclusão:</strong> {new Date(os.dataConclusao).toLocaleString()}</p>}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl font-semibold mb-4">Atualizar Status</h2>
        <div className="flex space-x-4">
          <Button onClick={() => handleStatusUpdate('Em Andamento')} className="bg-blue-600 hover:bg-blue-700 text-white w-auto px-4">Em Andamento</Button>
          <Button onClick={() => handleStatusUpdate('Concluída')} className="bg-green-600 hover:bg-green-700 text-white w-auto px-4">Concluída</Button>
          <Button onClick={() => handleStatusUpdate('Cancelada')} className="bg-red-600 hover:bg-red-700 text-white w-auto px-4">Cancelada</Button>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl font-semibold mb-4">Custos e Total</h2>
        <form onSubmit={handleCostUpdate} className="space-y-4">
          <div>
            <FormInput
              type="number"
              name="custoPecas"
              placeholder="Custo de Peças"
              value={costFormData.custoPecas}
              onChange={handleCostChange}
            />
            {costErrors.custoPecas && <p className="text-red-500 text-sm mt-1">{costErrors.custoPecas}</p>}
          </div>
          <div>
            <FormInput
              type="number"
              name="custoMaoDeObra"
              placeholder="Custo de Mão de Obra"
              value={costFormData.custoMaoDeObra}
              onChange={handleCostChange}
            />
            {costErrors.custoMaoDeObra && <p className="text-red-500 text-sm mt-1">{costErrors.custoMaoDeObra}</p>}
          </div>
          <Button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Atualizar Custos
          </Button>
        </form>
        {os.custoTotal !== undefined && <p className="text-xl font-bold mt-4">Custo Total: R$ {os.custoTotal.toFixed(2)}</p>}
      </div>

      {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
    </Layout> // Close Layout
  );
}
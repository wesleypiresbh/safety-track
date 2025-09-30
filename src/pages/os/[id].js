import React, { useState, useEffect } from 'react';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import Layout from '@/components/Layout';
import { getOSById } from '@/services/dataService';
import { getClientById } from '@/services/dataService';
import { getVehicleById } from '@/services/dataService';
import { getServiceById } from '@/services/dataService';
import { useRouter } from 'next/router';
import Button from '@/components/Button';

export default function OsDetailsPage({ os, client, vehicle, services, companyInfo }) {
  const router = useRouter();
  if (!os || !client || !vehicle) {
    return <p>Ordem de Serviço, Cliente ou Veículo não encontrado.</p>;
  }

  const [message, setMessage] = useState('');

  const handleConcluirOS = async () => {
    try {
      const response = await fetch(`/api/os/${os.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Concluída' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao concluir OS.');
      }

      setMessage('OS concluída com sucesso!');
      // Refresh the page to show updated status
      router.reload();
    } catch (error) {
      console.error('Erro ao concluir OS:', error);
      setMessage(`Erro: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-xl print:bg-white print:text-black print:shadow-none print:p-0">
        <div className="print:block hidden text-center mb-4">
          {companyInfo && (
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{companyInfo.name}</h2>
              <p>{companyInfo.address}</p>
              <p>Telefone: {companyInfo.phone}</p>
              <p>Email: {companyInfo.email}</p>
              <p>CNPJ: {companyInfo.cnpj}</p>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-6 text-black">ORDEM DE SERVIÇO</h1>
        </div>
        <h1 className="text-3xl font-bold mb-6 print:hidden">Detalhes da Ordem de Serviço #{os.id}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-orange-500">Cliente</h2>
            <p><strong>Nome:</strong> {client.name}</p>
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Telefone:</strong> {client.phone}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2 text-orange-500">Veículo</h2>
            <p><strong>Modelo:</strong> {vehicle.make} {vehicle.model}</p>
            <p><strong>Placa:</strong> {vehicle.plate}</p>
            <p><strong>Ano:</strong> {vehicle.year}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2 text-orange-500">Detalhes da OS</h2>
          <p><strong>Status:</strong> <span className="font-bold">{os.status}</span></p>
          <p><strong>Combustível:</strong> {os.combustivel}</p>
          <p><strong>Observações:</strong> {os.description}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2 text-orange-500">Serviços</h2>
          <ul>
            {services.map(service => (
              <li key={service.id} className="mb-1">{service.name}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 print:hidden">
          <h2 className="text-xl font-semibold mb-2 text-orange-500">Custos</h2>
          <p><strong>Custo das Peças:</strong> R$ {(os.custoPecas || 0).toFixed(2)}</p>
          <p><strong>Custo da Mão de Obra:</strong> R$ {(os.custoMaoDeObra || 0).toFixed(2)}</p>
          <p className="text-lg font-bold mt-2"><strong>Total:</strong> R$ {(os.total_price || 0).toFixed(2)}</p>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          {os.status !== 'Concluída' && (
            <Button onClick={handleConcluirOS} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm">
              Concluir OS
            </Button>
          )}
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center print:hidden"
          >
            <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5 4V1h10v3h2v10h-2v4H5v-4H3V4h2zm0 10v3h10v-3H5zm-2-8h14V6H3V6zm0 2v2h14V8H3z"/></svg>
            Imprimir
          </button>
        </div>
      </div>
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

    const os = await getOSById(id);
    const client = await getClientById(os.client_id) || null;
    const vehicle = await getVehicleById(os.vehicle_id) || null;
    
    const services = await Promise.all(
      (os.services_ids || []).map(serviceId => getServiceById(serviceId))
    ) || [];

    const serializableOS = {
      ...os,
      start_date: os.start_date.toISOString(),
      end_date: os.end_date ? os.end_date.toISOString() : null,
    };

    const companyInfoResponse = await fetch(`${protocol}://${host}/api/company-info`, {
      headers: { Cookie: `token=${token}` },
    });
    if (!companyInfoResponse.ok) {
      throw new Error(`Failed to fetch company info: ${companyInfoResponse.statusText}`);
    }
    const companyInfo = await companyInfoResponse.json();

    return {
      props: {
        os: serializableOS,
        client,
        vehicle,
        services,
        companyInfo,
      },
    };
  } catch (error) {
    console.error(`Error fetching OS details for id ${id}:`, error);
    return { notFound: true };
  }
}
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { formatCurrency } from '@/utils/helpers';

export default function FaturaDetailsPage({ initialFatura, os, client, vehicle, services }) {
  const router = useRouter();
  const [fatura, setFatura] = useState(initialFatura);
  const [message, setMessage] = useState('');

  const getServiceNames = (serviceIds) => {
    if (!serviceIds || serviceIds.length === 0) return <span>Nenhum serviço selecionado.</span>;
    return serviceIds.map((serviceId, index) => (
      <span key={serviceId}>
        {services.find(s => s.id === serviceId)?.name || serviceId}
        {index < serviceIds.length - 1 && <br />}
      </span>
    ));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Concluída':
        return 'text-green-600';
      case 'Pendente':
        return 'text-yellow-600';
      case 'Cancelada':
        return 'text-red-600';
      default:
        return 'text-gray-300';
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch(`/api/faturas/${fatura.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      setFatura((prev) => ({ ...prev, status: newStatus }));
      setMessage(`Status da fatura atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage(`Erro ao atualizar status: ${error.message}`);
    }
  };

  if (!fatura) {
    return (
      <Layout>
        <p>Carregando detalhes da fatura...</p>
      </Layout>
    );
  }

  const formattedDate = fatura.data_emissao ? new Date(fatura.data_emissao).toLocaleDateString('pt-BR') : 'N/A';

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Detalhes da Fatura #{fatura.id}</h1>

      <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl font-semibold mb-4">Informações da Fatura</h2>
        <p><strong>Data de Emissão:</strong> {formattedDate}</p>
        <p><strong>Status:</strong> <span className={`font-bold ${getStatusClass(fatura.status)}`}>{fatura.status}</span></p>
        <p><strong>Valor Total:</strong> {formatCurrency(fatura.valor_total)}</p>
      </div>

      {fatura.status === 'Pendente' && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
          <h2 className="text-2xl font-semibold mb-4">Atualizar Status</h2>
          <div className="flex space-x-4">
            <Button onClick={() => handleStatusUpdate('Concluída')} className="bg-green-600 hover:bg-green-700 text-white w-auto px-4">Concluída</Button>
            <Button onClick={() => handleStatusUpdate('Cancelada')} className="bg-red-600 hover:bg-red-700 text-white w-auto px-4">Cancelada</Button>
          </div>
        </div>
      )}

      {os && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl mb-6">
          <h2 className="text-2xl font-semibold mb-4">Informações da Ordem de Serviço #{os.id}</h2>
          <p><strong>Data de Abertura:</strong> {new Date(os.start_date).toLocaleString()}</p>
          <p><strong>KM:</strong> {os.km}</p>
          <p><strong>Observações:</strong> {os.observacoes}</p>
          {client && <p><strong>Cliente:</strong> {client.name} ({client.cpf_cnpj})</p>}
          {vehicle && <p><strong>Veículo:</strong> {vehicle.make} {vehicle.model} ({vehicle.plate})</p>}
          <p><strong>Serviços:</strong> {getServiceNames(os.services_ids)}</p>
        </div>
      )}

      {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
    </Layout>
  );
}

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

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host;

    const faturaResponse = await fetch(`${protocol}://${host}/api/faturas/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
    if (!faturaResponse.ok) {
      throw new Error(`Failed to fetch fatura: ${faturaResponse.statusText}`);
    }
    const { fatura, os, client, vehicle, services } = await faturaResponse.json();

    const serializableFatura = {
      ...fatura,
      data_emissao: fatura.data_emissao ? new Date(fatura.data_emissao).toISOString() : null,
    };

    return {
      props: {
        initialFatura: serializableFatura,
        os,
        client,
        vehicle,
        services,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching data for Fatura Details:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Button from '@/components/Button';
import { useRouter } from 'next/router';
import { formatCurrency } from '@/utils/helpers';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default function FaturasPage({ initialFaturas }) {
  const router = useRouter();
  const [faturas, setFaturas] = useState(initialFaturas);

  const handleViewDetails = (faturaId) => {
    router.push(`/faturas/${faturaId}`);
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

  const columns = [
    { Header: 'Nº Fatura', accessor: 'id' },
    { Header: 'Nº OS', accessor: 'os_id' },
    { Header: 'Data de Emissão', accessor: 'data_emissao' },
    { Header: 'Valor', accessor: 'valor_total', Cell: ({ value }) => formatCurrency(value) },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => {
        const statusClass = getStatusClass(value);
        return <span className={`font-bold ${statusClass}`}>{value}</span>;
      },
    },
    {
      Header: 'Ações',
      accessor: 'id',
      Cell: ({ row }) => (
        <Button onClick={() => handleViewDetails(row.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-2">
          Detalhes
        </Button>
      ),
    },
  ];

  const formattedFaturas = faturas.map(fatura => {
    const datePart = fatura.data_emissao.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return {
        ...fatura,
        data_emissao: `${day}/${month}/${year}`,
    };
  });

  const [showModal, setShowModal] = useState(false);
  const [completedOS, setCompletedOS] = useState([]);
  const [selectedOS, setSelectedOS] = useState([]);

  const handleGenerateFatura = async () => {
    // Fetch completed OS
    const response = await fetch('/api/os/data?status=Concluída');
    if (response.ok) {
      const { ordensDeServico } = await response.json();
      setCompletedOS(ordensDeServico);
      setShowModal(true);
    } else {
      console.error('Failed to fetch completed OS');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCompletedOS([]);
    setSelectedOS([]);
  };

  const handleSelectOS = (osId) => {
    setSelectedOS((prev) =>
      prev.includes(osId) ? prev.filter((id) => id !== osId) : [...prev, osId]
    );
  };

  const handleConfirmGeneration = async () => {
    for (const osId of selectedOS) {
      const response = await fetch('/api/faturas/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osId }),
      });

      if (response.ok) {
        // Update OS status
        await fetch(`/api/os/${osId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Faturada' }),
        });
      } else {
        console.error(`Failed to generate fatura for OS ${osId}`);
      }
    }
    // Refresh faturas list
    const response = await fetch('/api/faturas/data');
    if (response.ok) {
      const { faturas } = await response.json();
      setFaturas(faturas);
    }
    handleCloseModal();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel de Faturas</h1>
        <Button onClick={handleGenerateFatura} className="bg-green-600 hover:bg-green-700 text-white">
          Gerar Fatura
        </Button>
      </div>
      <Table columns={columns} data={formattedFaturas} />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-1/2">
            <h2 className="text-2xl font-bold mb-4">Selecione as Ordens de Serviço Concluídas</h2>
            <div className="space-y-2">
              {completedOS.map((os) => (
                <div key={os.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`os-${os.id}`}
                    checked={selectedOS.includes(os.id)}
                    onChange={() => handleSelectOS(os.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`os-${os.id}`}>
                    OS #{os.id} - {os.clientName} - {formatCurrency(os.total_price)}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button onClick={handleCloseModal} className="bg-gray-600 hover:bg-gray-700 text-white">
                Cancelar
              </Button>
              <Button onClick={handleConfirmGeneration} className="bg-blue-600 hover:bg-blue-700 text-white">
                Gerar Faturas Selecionadas
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/faturas/data`;

    const response = await fetch(apiUrl, {
      headers: { Cookie: `token=${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch faturas data: ${response.statusText}`);
    }

    const { faturas } = await response.json();

    return {
      props: {
        initialFaturas: faturas,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching data for Faturas:', error);
    return { redirect: { destination: '/', permanent: false } };
  }
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { formatCurrency } from '@/utils/helpers';

export default function OrcamentoDetailsPage({ initialOrcamento, clients, vehicles, services, companyInfo }) {
  const router = useRouter();
  const { id } = router.query;
  const [orcamento, setOrcamento] = useState(initialOrcamento);
  const [message, setMessage] = useState('');
  const [displayFormattedDate, setDisplayFormattedDate] = useState('');
  const [displayUpdatedAt, setDisplayUpdatedAt] = useState('');

  useEffect(() => {
    if (orcamento.data_orcamento) {
      setDisplayFormattedDate(new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR'));
    } else {
      setDisplayFormattedDate('N/A');
    }

    if (orcamento.updated_at) {
      const date = new Date(orcamento.updated_at);
      setDisplayUpdatedAt(`(Editado em ${date.toLocaleDateString('pt-BR')} as ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`);
    } else {
      setDisplayUpdatedAt('');
    }
  }, [orcamento.data_orcamento, orcamento.updated_at]);

  const handleApprove = async () => {
    if (!confirm('Tem certeza que deseja aprovar este orçamento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const res = await fetch(`/api/orcamentos/${id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao aprovar o orçamento.');
      }

      const updatedOrcamento = await res.json();

      // Update the state to reflect the change
      setOrcamento(prev => ({ ...prev, status: updatedOrcamento.status }));
      setMessage('Orçamento aprovado com sucesso! A página será recarregada.');

      // Reload the page to reflect the new status and potentially created OS
      setTimeout(() => router.reload(), 2000);

    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      setMessage(`Erro: ${error.message}`);
    }
  };

  // Helper to find client/vehicle/service names
  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || 'N/A';
  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} - ${vehicle.plate}` : 'N/A';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aprovado':
        return 'text-green-600';
      case 'Pendente':
        return 'text-yellow-600';
      case 'Rejeitado':
        return 'text-red-600';
      default:
        return 'text-gray-300';
    }
  };

  // Format date for display
  // This was moved into useEffect for hydration fix, so this line is no longer needed here.
  // const formattedDate = orcamento.data_orcamento ? new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR') : 'N/A';

  const calculateTotal = () => {
    let total = 0;

    // Sum service values
    if (orcamento.servicos && orcamento.servicos.length > 0) {
      orcamento.servicos.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service && service.price) {
          total += service.price;
        }
      });
    }

    // Sum part values
    if (orcamento.pecas && orcamento.pecas.length > 0) {
      orcamento.pecas.forEach(part => {
        if (part.value) {
          total += part.value;
        }
      });
    }
    return total;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-xl print:bg-white print:text-black print:shadow-none print:p-0">
        <div className="print:block hidden text-center mb-4">
          {companyInfo && (
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{companyInfo.name}</h2>
              <p>{companyInfo.address} | Telefone: {companyInfo.phone}</p>
              <p>Email: {companyInfo.email} | CNPJ: {companyInfo.cnpj}</p>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-6 text-black">ORÇAMENTO</h1>
        </div>
        <h1 className="text-3xl font-bold mb-6 print:hidden">Detalhes do Orçamento #{orcamento.numero_orcamento}</h1>
        <h2 className="text-2xl font-semibold mb-4">Informações do Orçamento</h2>
                <p><strong>Data:</strong> {displayFormattedDate}
          {orcamento.updated_at && 
                        <span className="text-sm text-gray-400 ml-2">
              {displayUpdatedAt}
            </span>
          }
        </p>        <p><strong>Status:</strong> <span className={`font-bold ${getStatusClass(orcamento.status)}`}>{orcamento.status}</span></p>
        <p><strong>KM:</strong> {orcamento.km}</p>
        <p><strong>Cliente:</strong> {getClientName(orcamento.cliente_id)}</p>
        <p><strong>Veículo:</strong> {getVehicleInfo(orcamento.veiculo_id)}</p>
                <div>
          <strong>Serviços:</strong>
          {orcamento.servicos && orcamento.servicos.length > 0 ? (
            <ul>
              {orcamento.servicos.map((serviceId, index) => (
                <li key={index}>
                  {services.find(s => s.id === serviceId)?.name} - {formatCurrency(services.find(s => s.id === serviceId)?.price)}
                </li>
              ))}
            </ul>
          ) : (
            'Nenhum serviço selecionado.'
          )}
        </div>
        <div>
          <strong>Peças:</strong>{' '}
          {orcamento.pecas && orcamento.pecas.length > 0 ? (
            <ul>
              {orcamento.pecas.map((part, index) => (
                <li key={index}>
                  {part.name} - {formatCurrency(part.value)}
                </li>
              ))}
            </ul>
          ) : (
            'Nenhuma peça informada.'
          )}
        </div>        {orcamento.descricao && <p><strong>Descrição:</strong> {orcamento.descricao}</p>}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xl font-bold">Valor Total do Orçamento: {formatCurrency(calculateTotal())}</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6 print:hidden">
        {orcamento.status === 'Pendente' && (
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm">
            Aprovar Orçamento
          </Button>
        )}
        {orcamento.status !== 'Aprovado' && (
          <Link href={`/orcamentos/edit/${orcamento.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-sm">
              Editar Orçamento
            </Button>
          </Link>
        )}
        <button
          onClick={() => window.print()}          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center print:hidden"
        >
          <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5 4V1h10v3h2v10h-2v4H5v-4H3V4h2zm0 10v3h10v-3H5zm-2-8h14V6H3V6zm0 2v2h14V8H3z"/></svg>
          Imprimir
        </button>
      </div>

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

    // Fetch specific orcamento details from the new API
    const orcamentoResponse = await fetch(`${protocol}://${host}/api/orcamentos/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
    if (!orcamentoResponse.ok) {
      throw new Error(`Failed to fetch orcamento: ${orcamentoResponse.statusText}`);
    }
    const { orcamento: fetchedOrcamento, client, vehicle, services, clients, vehicles } = await orcamentoResponse.json();

    const companyInfoResponse = await fetch(`${protocol}://${host}/api/company-info`, {
      headers: { Cookie: `token=${token}` },
    });
    if (!companyInfoResponse.ok) {
      throw new Error(`Failed to fetch company info: ${companyInfoResponse.statusText}`);
    }
    const companyInfo = await companyInfoResponse.json();

    // Ensure dates are serializable
    const serializableOrcamento = {
      ...fetchedOrcamento,
      data_orcamento: fetchedOrcamento.data_orcamento ? new Date(fetchedOrcamento.data_orcamento).toISOString() : null,
      updated_at: fetchedOrcamento.updated_at ? new Date(fetchedOrcamento.updated_at).toISOString() : null,
    };

    return {
      props: {
        initialOrcamento: serializableOrcamento,
        clients,
        vehicles,
        services,
        companyInfo,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching data for Orcamento Details:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}
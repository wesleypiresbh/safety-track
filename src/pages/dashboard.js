import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card'; // Import Card
import { parse } from 'cookie'; // This was added with getServerSideProps, but I'll put it back in the correct place later
import jwt from 'jsonwebtoken'; // This was added with getServerSideProps, but I'll put it back in the correct place later
import {
  getTotalClients,
  getTotalVehicles,
  getTotalOS,
  getOSCountByStatus,
  getRecentClients,
  getRecentVehicles,
  getRecentOS,
} from '@/services/dataService';

export default function Dashboard({ user, metrics, recentClients, recentVehicles, recentOS }) { // Receive all data as props
  

  

  return (
    <Layout>
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
      {user && <p className="text-white mb-4">Bem-vindo, {user.email}!</p>} {/* Display user email */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Total de Clientes">
          <p className="text-5xl font-bold">{metrics.totalClients}</p>
        </Card>
        <Card title="Total de Veículos">
          <p className="text-5xl font-bold">{metrics.totalVehicles}</p>
        </Card>
        <Card title="Total de OS">
          <p className="text-5xl font-bold">{metrics.totalOS}</p>
        </Card>
        <Card title="OS Abertas">
          <p className="text-5xl font-bold">{metrics.osOpen}</p>
        </Card>
        <Card title="OS Em Andamento">
          <p className="text-5xl font-bold">{metrics.osInProgress}</p>
        </Card>
        <Card title="OS Concluídas">
          <p className="text-5xl font-bold">{metrics.osCompleted}</p>
        </Card>
        <Card title="OS Canceladas">
          <p className="text-5xl font-bold">{metrics.osCanceled}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Clientes Recentes">
          {recentClients.length === 0 ? (
            <p>Nenhum cliente recente.</p>
          ) : (
            <ul>
              {recentClients.map((client) => (
                <li key={client.id} className="mb-2">
                  {client.name} ({client.cpf_cnpj})
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Veículos Recentes">
          {recentVehicles.length === 0 ? (
            <p>Nenhum veículo recente.</p>
          ) : (
            <ul>
              {recentVehicles.map((vehicle) => (
                <li key={vehicle.id} className="mb-2">
                  {vehicle.make} {vehicle.model} ({vehicle.plate})
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="OS Recentes">
          {recentOS.length === 0 ? (
            <p>Nenhuma OS recente.</p>
          ) : (
            <ul>
              {recentOS.map((os) => (
                <li key={os.id} className="mb-2">
                  OS #{os.id} - Status: {os.status} - Veículo: {os.vehicle_make} {os.vehicle_model} ({os.vehicle_plate})
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/'; // Redireciona para a página de login
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Sair
        </button>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: '/', // Redireciona para a página de login
        permanent: false,
      },
    };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Fetch all dashboard data on the server-side
    const [
      totalClients,
      totalVehicles,
      totalOS,
      osOpen,
      osInProgress,
      osCompleted,
      osCanceled,
      recentClients,
      recentVehicles,
      recentOS,
    ] = await Promise.all([
      getTotalClients(),
      getTotalVehicles(),
      getTotalOS(),
      getOSCountByStatus('Aberta'),
      getOSCountByStatus('Em Andamento'),
      getOSCountByStatus('OS Concluida'),
      getOSCountByStatus('Cancelada'),
      getRecentClients(),
      getRecentVehicles(),
      getRecentOS(),
    ]);

    const recentOSData = await getRecentOS();
    const serializableRecentOS = recentOSData.map(os => {
      const plainOs = JSON.parse(JSON.stringify(os));
      return {
        ...plainOs,
        start_date: plainOs.start_date ? new Date(plainOs.start_date).toISOString() : null,
        end_date: plainOs.end_date ? new Date(plainOs.end_date).toISOString() : null,
      };
    });

    const metrics = {
      totalClients,
      totalVehicles,
      totalOS,
      osOpen,
      osInProgress,
      osCompleted,
      osCanceled,
    };

    const props = {
      user,
      metrics,
      recentClients,
      recentVehicles,
      recentOS: serializableRecentOS,
    };

    // Aggressively serialize the entire props object
    const finalSerializableProps = JSON.parse(JSON.stringify(props));

    return {
      props: finalSerializableProps,
    };
  } catch (error) {
    console.error('Erro ao verificar token ou buscar dados do dashboard:', error);
    return {
      redirect: {
        destination: '/', // Redireciona para a página de login em caso de token inválido ou erro na busca de dados
        permanent: false,
      },
    };
  }
}
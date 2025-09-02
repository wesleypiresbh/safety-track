import React, { useState, useEffect } from 'react';
// Removed: import { logout } from '@/services/authService';
// Removed: import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Card from '@/components/Card'; // Import Card
import {
  getTotalClients,
  getTotalVehicles,
  getTotalOS,
  getOSCountByStatus,
  getRecentClients,
  getRecentVehicles,
  getRecentOS,
} from '@/services/firestoreService';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    totalVehicles: 0,
    totalOS: 0,
    osOpen: 0,
    osInProgress: 0,
    osCompleted: 0,
    osCanceled: 0,
  });
  const [recentClients, setRecentClients] = useState([]);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [recentOS, setRecentOS] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
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
          getOSCountByStatus('Concluída'),
          getOSCountByStatus('Cancelada'),
          getRecentClients(),
          getRecentVehicles(),
          getRecentOS(),
        ]);

        setMetrics({
          totalClients,
          totalVehicles,
          totalOS,
          osOpen,
          osInProgress,
          osCompleted,
          osCanceled,
        });
        setRecentClients(recentClients);
        setRecentVehicles(recentVehicles);
        setRecentOS(recentOS);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Removed: handleLogout function

  if (loading) {
    return (
      <Layout>
        <p>Carregando dados do dashboard...</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-500">{error}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

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
                  {client.nome} ({client.cpfCnpj})
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
                  {vehicle.marca} {vehicle.modelo} ({vehicle.placa})
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
                  OS #{os.id.substring(0, 6)} - Status: {os.status}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Removed: Logout Button */}
    </Layout>
  );
}

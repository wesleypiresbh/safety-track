import { pool } from '../lib/db';

// Função auxiliar para executar consultas
const executeQuery = async (queryText, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(queryText, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// --- Clientes ---
export const getAllClients = async () => {
  return executeQuery('SELECT * FROM clients ORDER BY id DESC');
};

export const getClientById = async (id) => {
  const result = await executeQuery('SELECT * FROM clients WHERE id = $1', [id]);
  return result[0];
};

export const addClient = async (clientData) => {
  const { name, email, phone, address, cpf_cnpj } = clientData;
  const result = await executeQuery(
    'INSERT INTO clients (name, email, phone, address, cpf_cnpj) VALUES ($1, $2, $3, $4, $5) RETURNING *'
    ,
    [name, email, phone, address, cpf_cnpj]
  );
  return result[0];
};

export const updateClient = async (id, clientData) => {
  const { name, email, phone, address, cpf_cnpj } = clientData;
  const result = await executeQuery(
    'UPDATE clients SET name = $1, email = $2, phone = $3, address = $4, cpf_cnpj = $5 WHERE id = $6 RETURNING *'
    ,
    [name, email, phone, address, cpf_cnpj, id]
  );
  return result[0];
};

export const deleteClient = async (id) => {
  await executeQuery('DELETE FROM clients WHERE id = $1', [id]);
};

export const getTotalClients = async () => {
  const result = await executeQuery('SELECT COUNT(*) FROM clients');
  return parseInt(result[0].count, 10);
};

export const getRecentClients = async (limit = 5) => {
  return executeQuery('SELECT * FROM clients ORDER BY id DESC LIMIT $1', [limit]);
};

// --- Veículos ---
export const getAllVehicles = async () => {
  return executeQuery('SELECT * FROM vehicles ORDER BY id DESC');
};

export const getVehicleById = async (id) => {
  const result = await executeQuery('SELECT * FROM vehicles WHERE id = $1', [id]);
  return result[0];
};

export const getVehicleByPlate = async (plate) => {
  const result = await executeQuery('SELECT * FROM vehicles WHERE plate = $1', [plate]);
  return result[0];
};

export const addVehicle = async (vehicleData) => {
  const { make, model, year, plate, client_id } = vehicleData;
  const result = await executeQuery(
    'INSERT INTO vehicles (make, model, year, plate, client_id) VALUES ($1, $2, $3, $4, $5) RETURNING *'
    ,
    [make, model, year, plate, client_id]
  );
  return result[0];
};

export const updateVehicle = async (id, vehicleData) => {
  const { make, model, year, plate, client_id } = vehicleData;
  const result = await executeQuery(
    'UPDATE vehicles SET make = $1, model = $2, year = $3, plate = $4, client_id = $5 WHERE id = $6 RETURNING *'
    ,
    [make, model, year, plate, client_id, id]
  );
  return result[0];
};

export const updateVehicleDetails = async (id, vehicleData) => {
  const { make, model, year, plate } = vehicleData;
  const result = await executeQuery(
    'UPDATE vehicles SET make = $1, model = $2, year = $3, plate = $4 WHERE id = $5 RETURNING *'
    ,
    [make, model, year, plate, id]
  );
  return result[0];
};

export const deleteVehicle = async (id) => {
  await executeQuery('DELETE FROM vehicles WHERE id = $1', [id]);
};

export const getTotalVehicles = async () => {
  const result = await executeQuery('SELECT COUNT(*) FROM vehicles');
  return parseInt(result[0].count, 10);
};

export const getRecentVehicles = async (limit = 5) => {
  return executeQuery('SELECT * FROM vehicles ORDER BY id DESC LIMIT $1', [limit]);
};

// --- Ordens de Serviço (OS) ---
export const getAllOS = async () => {
  return executeQuery('SELECT * FROM service_orders ORDER BY id DESC');
};

export const getOSByStatus = async (status) => {
  return executeQuery('SELECT * FROM service_orders WHERE status = $1 ORDER BY id DESC', [status]);
};

export const getOSById = async (id) => {
  const result = await executeQuery('SELECT *, custo_pecas as \"custoPecas\", custo_mao_de_obra as \"custoMaoDeObra\" FROM service_orders WHERE id = $1', [id]);
  return result[0];
};

export const addOS = async (osData) => {
  const { client_id, vehicle_id, status, description, end_date, total_price, services_ids, custo_pecas, custo_mao_de_obra, combustivel } = osData;

  const result = await executeQuery(
    'INSERT INTO service_orders (client_id, vehicle_id, status, description, end_date, total_price, services_ids, custo_pecas, custo_mao_de_obra, combustivel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *'
    ,
    [client_id, vehicle_id, status, description, end_date, total_price, services_ids, custo_pecas, custo_mao_de_obra, combustivel]
  );
  return result[0];
};

export const updateOS = async (id, osData) => {
  const { client_id, vehicle_id, status, description, end_date, total_price, services_ids } = osData;
  const result = await executeQuery(
    'UPDATE service_orders SET client_id = $1, vehicle_id = $2, status = $3, description = $4, end_date = $5, total_price = $6, services_ids = $7 WHERE id = $8 RETURNING *'
    ,
    [client_id, vehicle_id, status, description, end_date, total_price, services_ids, id]
  );
  return result[0];
};

export const updateOSStatus = async (id, status) => {
  const result = await executeQuery(
    'UPDATE service_orders SET status = $1 WHERE id = $2 RETURNING *'
    ,
    [status, id]
  );
  return result[0];
};

export const updateOSCosts = async (id, custoPecas, custoMaoDeObra) => {
  const result = await executeQuery(
    'UPDATE service_orders SET custo_pecas = $1, custo_mao_de_obra = $2, total_price = $1 + $2 WHERE id = $3 RETURNING *'
    ,
    [custoPecas, custoMaoDeObra, id]
  );
  return result[0];
};

export const deleteOS = async (id) => {
  await executeQuery('DELETE FROM service_orders WHERE id = $1', [id]);
};

export const getTotalOS = async () => {
  const result = await executeQuery('SELECT COUNT(*) FROM service_orders');
  return parseInt(result[0].count, 10);
};

export const getOSCountByStatus = async (status) => {
  const result = await executeQuery('SELECT COUNT(*) FROM service_orders WHERE status = $1', [status]);
  return parseInt(result[0].count, 10);
};

export const getRecentOS = async (limit = 5) => {
  const query = `
    SELECT
      so.*,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.plate as vehicle_plate
    FROM service_orders so
    JOIN vehicles v ON so.vehicle_id = v.id
    ORDER BY so.id DESC
    LIMIT $1
  `;
  return executeQuery(query, [limit]);
};

// --- Orçamentos ---
export const getAllOrcamentos = async () => {
  const query = `
    SELECT
      o.id,
      o.numero_orcamento,
      o.data_orcamento,
      o.km,
      o.servicos,
      o.pecas::jsonb as pecas,
      o.status,
      o.valor_orcamento as "valorOrcamento",
      o.cliente_id,
      o.veiculo_id,
      c.name as client_name,
      v.model as vehicle_model,
      v.plate as vehicle_plate
    FROM orcamentos o
    JOIN clients c ON o.cliente_id = c.id
    JOIN vehicles v ON o.veiculo_id = v.id
    ORDER BY o.numero_orcamento DESC
  `;
  return executeQuery(query);
};

export const getOrcamentoById = async (id) => {
    const result = await executeQuery('SELECT *, pecas::jsonb as pecas, valor_orcamento as \"valorOrcamento\" FROM orcamentos WHERE id = $1', [id]);
    return result[0];
}

export const updateOrcamentoStatus = async (id, status) => {
    const result = await executeQuery(
        'UPDATE orcamentos SET status = $1 WHERE id = $2 RETURNING *'
        ,
        [status, id]
    );
    return result[0];
}

export const addOrcamento = async (orcamentoData) => {
  const { dataOrcamento, clienteId, veiculoId, km, descricao = null, servicos, pecas, valorOrcamento } = orcamentoData;

  // Generate numero_orcamento automatically
  const maxNumeroOrcamentoResult = await executeQuery('SELECT MAX(numero_orcamento) FROM orcamentos');
  const lastNumeroOrcamento = maxNumeroOrcamentoResult[0].max || 999; // Start from 1000 if no records
  const newNumeroOrcamento = lastNumeroOrcamento + 1;

  const status = 'Pendente'; // Set default status

  // Convert pecas array to JSON string for storage
  const pecasJson = JSON.stringify(pecas);

  const result = await executeQuery(
    'INSERT INTO orcamentos (numero_orcamento, data_orcamento, cliente_id, veiculo_id, km, descricao, servicos, pecas, status, valor_orcamento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *'
    ,
    [newNumeroOrcamento, dataOrcamento, clienteId, veiculoId, km, descricao, servicos, pecasJson, status, valorOrcamento]
  );
  return result[0];
};

export const updateOrcamento = async (id, orcamentoData) => {
  const { clienteId, veiculoId, km, servicos, pecas, valorOrcamento } = orcamentoData;
  const pecasJson = JSON.stringify(pecas);

  const result = await executeQuery(
    'UPDATE orcamentos SET cliente_id = $1, veiculo_id = $2, km = $3, servicos = $4, pecas = $5, valor_orcamento = $6, updated_at = NOW() WHERE id = $7 RETURNING *'
    ,
    [clienteId, veiculoId, km, servicos, pecasJson, valorOrcamento, id]
  );
  return result[0];
};

// --- Serviços (já em db.js, mas precisa de funções para interagir) ---
export const getServices = async () => {
  return executeQuery('SELECT * FROM services ORDER BY id');
};

export const getServiceById = async (id) => {
  const result = await executeQuery('SELECT * FROM services WHERE id = $1', [id]);
  return result[0];
};

export const generateNextServiceId = async () => {
  const result = await executeQuery('SELECT id FROM services WHERE id LIKE \'S%\' ORDER BY id DESC LIMIT 1');
  let nextIdNum = 1;
  if (result.length > 0) {
    const lastId = result[0].id; // e.g., "S0005"
    const lastIdNum = parseInt(lastId.substring(1), 10); // e.g., 5
    nextIdNum = lastIdNum + 1;
  }
  return `S${String(nextIdNum).padStart(4, '0')}`;
};

export const addService = async (serviceData) => {
  let { id, name, description, price, duration, category } = serviceData;

  if (!id) { // If ID is not provided, generate it
    id = await generateNextServiceId();
  }

  const result = await executeQuery(
    'INSERT INTO services (id, name, description, price, duration, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
    ,
    [id, name, description, price, duration, category]
  );
  return result[0];
};

export const updateService = async (id, serviceData) => {
  const { name, description, price, duration, category } = serviceData;
  const result = await executeQuery(
    'UPDATE services SET name = $1, description = $2, price = $3, duration = $4, category = $5 WHERE id = $6 RETURNING *'
    ,
    [name, description, price, duration, category, id]
  );
  return result[0];
};

export const deleteService = async (id) => {
  await executeQuery('DELETE FROM services WHERE id = $1', [id]);
};

// --- Vehicle Services Performed ---
export const getVehicleServicesPerformed = async (vehicleId) => {
  return executeQuery('SELECT * FROM vehicle_services_performed WHERE vehicle_id = $1 ORDER BY date DESC', [vehicleId]);
};

export const addVehicleServicePerformed = async (serviceData) => {
  const { vehicle_id, description, value, date } = serviceData;
  const result = await executeQuery(
    'INSERT INTO vehicle_services_performed (vehicle_id, description, value, date) VALUES ($1, $2, $3, $4) RETURNING *'
    ,
    [vehicle_id, description, value, date]
  );
  return result[0];
};

// --- Company Info ---
export const getCompanyInfo = async () => {
  const result = await executeQuery('SELECT * FROM company_info LIMIT 1');
  return result[0] || {};
};

export const updateCompanyInfo = async (companyData) => {
  const { name, address, phone, email, cnpj } = companyData;
  const existingInfo = await getCompanyInfo();

  if (existingInfo && existingInfo.id) {
    // Update existing record
    const result = await executeQuery(
      'UPDATE company_info SET name = $1, address = $2, phone = $3, email = $4, cnpj = $5 WHERE id = $6 RETURNING *'
      ,
      [name, address, phone, email, cnpj, existingInfo.id]
    );
    return result[0] || {};
  } else {
    // Insert new record
    const result = await executeQuery(
      'INSERT INTO company_info (name, address, phone, email, cnpj) VALUES ($1, $2, $3, $4, $5) RETURNING *'
      ,
      [name, address, phone, email, cnpj]
    );
    return result[0] || {};
  }
};
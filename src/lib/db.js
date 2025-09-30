import { Pool } from 'pg';

// Use uma string de conexão de variáveis de ambiente
// Exemplo: postgres://user:password@host:port/database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/safetytrack',
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price REAL,
        duration VARCHAR(255),
        category VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        cpf_cnpj VARCHAR(20) UNIQUE
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER,
        plate VARCHAR(20) UNIQUE NOT NULL,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS service_orders (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL,
        description TEXT,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP WITH TIME ZONE,
        total_price REAL,
        custo_pecas REAL DEFAULT 0,
        custo_mao_de_obra REAL DEFAULT 0,
        km VARCHAR(255),
        combustivel VARCHAR(50),
        services_ids TEXT[] -- Array of service IDs
      );

      CREATE TABLE IF NOT EXISTS vehicle_services_performed (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        value REAL,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orcamentos (
        id SERIAL PRIMARY KEY,
        numero_orcamento INTEGER UNIQUE NOT NULL,
        data_orcamento DATE NOT NULL,
        cliente_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        veiculo_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
        km VARCHAR(255),
        descricao TEXT,
        servicos TEXT[],
        pecas JSONB,
        valor_orcamento REAL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pendente' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faturas (
        id SERIAL PRIMARY KEY,
        os_id INTEGER REFERENCES service_orders(id) ON DELETE CASCADE,
        data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        valor_total REAL,
        status VARCHAR(50) DEFAULT 'Pendente' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS company_info (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        cnpj VARCHAR(20) UNIQUE
      );
      
      -- Adicione outras tabelas aqui conforme necessário (por exemplo, parts, etc.)
    `);
    
  } catch (err) {
    console.error('Erro ao executar migrações PostgreSQL:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Executa migrações quando a aplicação inicia
runMigrations().catch(err => {
  console.error('Falha ao executar migrações do banco de dados:', err);
  process.exit(1);
});

export { pool };
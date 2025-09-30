import { pool } from '../lib/db'; // Importa o pool PostgreSQL
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Para hashing bcrypt

export const registerWithEmail = async (email, password) => {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await client.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    return result.rows[0]; // Retorna o usuário inserido (id, email)
  } catch (error) {
    if (error.code === '23505') { // Código de erro de violação de unicidade para PostgreSQL
      throw new Error('Email já registrado.');
    }
    throw error;
  } finally {
    client.release();
  }
};

export const loginWithEmail = async (email, password) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.');
    }

    // Retorna um objeto de usuário simplificado, sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } finally {
    client.release();
  }
};

export const logout = async () => {
  // Para uma configuração simples, o logout pode envolver a limpeza de um token/cookie no lado do cliente.
  // No lado do servidor, esta função pode não fazer nada diretamente com o DB.
  // Mantemos para consistência da API.
  return Promise.resolve({ message: 'Deslogado com sucesso.' });
};

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import * as dataService from '@/services/dataService';

// TODO: Adjust Zod schema as needed for updates
const clientSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório e deve ter pelo menos 3 caracteres.'),
  cpfCnpj: z.string().regex(/^(\d{11}|\d{14})$/, 'CPF/CNPJ inválido.'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido.').optional().or(z.literal('')),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
});

export default function ClientDetails({ client }) {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    nome: client.name,
    cpfCnpj: client.cpf_cnpj,
    telefone: client.phone || '',
    email: client.email || '',
    endereco: client.address || '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      let v = value.replace(/\D/g, '');
      v = v.substring(0, 11);
      if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1)$2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d*)/, '($1)$2');
      }
      setFormData((prev) => ({ ...prev, [name]: v }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      // TODO: Add Zod validation

      const response = await fetch('/api/clientes/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update client.');
      }

      setMessage('Cliente atualizado com sucesso!');

    } catch (error) {
      setMessage(`Erro ao atualizar cliente: ${error.message}`);
    }
  };

  if (router.isFallback) {
    return <Layout><p>Carregando...</p></Layout>;
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Editar Cliente</h1>
      
      <form onSubmit={handleUpdateClient} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
          <FormInput
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
          />
          {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">CPF ou CNPJ</label>
          <FormInput
            type="text"
            name="cpfCnpj"
            value={formData.cpfCnpj}
            onChange={handleChange}
          />
          {errors.cpfCnpj && <p className="text-red-500 text-sm mt-1">{errors.cpfCnpj}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
          <FormInput
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
          />
          {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <FormInput
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
          <FormInput
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
          />
          {errors.endereco && <p className="text-red-500 text-sm mt-1">{errors.endereco}</p>}
        </div>
        
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Salvar Alterações
        </Button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
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
    
    const client = await dataService.getClientById(id);

    if (!client) {
      return { notFound: true };
    }

    return {
      props: { 
        client,
      }, 
    };
  } catch (error) {
    console.error('Error fetching client details:', error);
    return { redirect: { destination: '/', permanent: false } };
  }
}

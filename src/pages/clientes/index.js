import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const clientSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório e deve ter pelo menos 3 caracteres.'),
  cpfCnpj: z.string().regex(/^(\d{11}|\d{14})$/, 'CPF/CNPJ inválido.'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido.').optional().or(z.literal('')),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
});

export default function Clientes({ clients }) {
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    email: '',
    endereco: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      const unmaskedFormData = {
        ...formData,
        telefone: formData.telefone.replace(/\D/g, ''),
      };
      // Validate with Zod
      clientSchema.parse(unmaskedFormData);

      // Check CPF/CNPJ uniqueness via API
      const checkResponse = await fetch(`/api/clientes/check-cpf-cnpj?cpfCnpj=${unmaskedFormData.cpfCnpj}`);
      const checkData = await checkResponse.json();
      if (checkData.isTaken) {
        setErrors({ cpfCnpj: 'CPF/CNPJ já cadastrado.' });
        return;
      }

      // Add client via API
      const addResponse = await fetch('/api/clientes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unmaskedFormData),
      });

      const addData = await addResponse.json();

      if (!addResponse.ok) {
        throw new Error(addData.message || 'Failed to add client.');
      }

      setMessage('Cliente cadastrado com sucesso!');
      setFormData({
        nome: '',
        cpfCnpj: '',
        telefone: '',
        email: '',
        endereco: '',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setErrors(newErrors);
      } else {
        setMessage(`Erro ao cadastrar cliente: ${error.message}`);
      }
    }
  };

  return (
    <Layout> {/* Wrap with Layout */}
      <h1 className="text-3xl font-bold mb-6">Cadastro de Clientes</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto">
        <div>
          <FormInput
            type="text"
            name="nome"
            placeholder="Nome Completo"
            value={formData.nome}
            onChange={handleChange}
          />
          {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
        </div>
        
        <div>
          <FormInput
            type="text"
            name="cpfCnpj"
            placeholder="CPF ou CNPJ"
            value={formData.cpfCnpj}
            onChange={handleChange}
          />
          {errors.cpfCnpj && <p className="text-red-500 text-sm mt-1">{errors.cpfCnpj}</p>}
        </div>
        
        <div>
          <FormInput
            type="text"
            name="telefone"
            placeholder="(00)00000-0000"
            value={formData.telefone}
            onChange={handleChange}
          />
          {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
        </div>
        
        <div>
          <FormInput
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <FormInput
            type="text"
            name="endereco"
            placeholder="Endereço"
            value={formData.endereco}
            onChange={handleChange}
          />
          {errors.endereco && <p className="text-red-500 text-sm mt-1">{errors.endereco}</p>}
        </div>
        
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Cadastrar Cliente
        </Button>
      </form>

      {message && <p className="text-green-500 mt-4 text-center">{message}</p>}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Clientes Cadastrados</h2>
        {clients.length === 0 ? (
          <p>Nenhum cliente cadastrado.</p>
        ) : (
          <ul className="space-y-4">
            {clients.map((client) => (
              <li key={client.id} className="bg-gray-900 p-4 rounded-lg shadow-xl flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{client.name}</p>
                  <p className="text-sm text-gray-400">CPF/CNPJ: {client.cpf_cnpj}</p>
                  <p className="text-sm text-gray-400">Email: {client.email}</p>
                  <p className="text-sm text-gray-400">Telefone: {client.phone}</p>
                </div>
                <Link href={`/clientes/${client.id}`} className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded transition duration-200">
                  Ver Detalhes
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout> // Close Layout
  );
}

import * as dataService from '@/services/dataService';

export async function getServerSideProps(context) {
  const { req } = context;
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
    
    const clients = await dataService.getAllClients();

    return {
      props: { 
        clients: clients || [],
      }, 
    };
  } catch (error) {
    console.error('Error verifying token or fetching clients for Clientes page:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

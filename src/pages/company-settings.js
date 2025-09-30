import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import Layout from '@/components/Layout';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const companyInfoSchema = z.object({
  name: z.string().min(1, 'Nome da empresa é obrigatório.'),
  address: z.string().min(1, 'Endereço é obrigatório.'),
  phone: z.string().min(1, 'Telefone é obrigatório.'),
  email: z.string().email('Email inválido.').min(1, 'Email é obrigatório.'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório.'),
});

export default function CompanySettingsPage({ initialCompanyInfo }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    cnpj: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialCompanyInfo && Object.keys(initialCompanyInfo).length > 0) {
      setFormData(initialCompanyInfo);
    }
  }, [initialCompanyInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      companyInfoSchema.parse(formData);

      const response = await fetch('/api/company-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update company info.');
      }

      setMessage('Informações da empresa atualizadas com sucesso!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        for (const issue of error.issues) {
          newErrors[issue.path[0]] = issue.message;
        }
        setErrors(newErrors);
      } else {
        setMessage(`Erro ao atualizar informações da empresa: ${error.message}`);
      }
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Configurações da Empresa</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg mx-auto">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Nome da Empresa</label>
          <FormInput
            id="name"
            type="text"
            name="name"
            placeholder="Nome da Empresa"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
          <FormInput
            id="address"
            type="text"
            name="address"
            placeholder="Endereço"
            value={formData.address}
            onChange={handleChange}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
          <FormInput
            id="phone"
            type="text"
            name="phone"
            placeholder="Telefone"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <FormInput
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="cnpj" className="block text-sm font-medium text-gray-400 mb-1">CNPJ</label>
          <FormInput
            id="cnpj"
            type="text"
            name="cnpj"
            placeholder="CNPJ"
            value={formData.cnpj}
            onChange={handleChange}
          />
          {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
        </div>

        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded">
          Salvar Informações
        </Button>
      </form>

      {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
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
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/company-info`;

    const response = await fetch(apiUrl, {
      headers: { Cookie: `token=${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch company info: ${response.statusText}`);
    }

    const initialCompanyInfo = await response.json();

    return {
      props: {
        initialCompanyInfo,
      },
    };
  } catch (error) {
    console.error('Error verifying token or fetching company info:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

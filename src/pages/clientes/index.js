import React, { useState } from 'react';
import { z } from 'zod';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import Layout from '@/components/Layout'; // Import Layout
import { addClient, getClientByCpfCnpj } from '@/services/firestoreService';

const clientSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório e deve ter pelo menos 3 caracteres.'),
  cpfCnpj: z.string().regex(/^(\d{11}|\d{14})$/, 'CPF/CNPJ inválido.'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido.').optional().or(z.literal('')),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
});

export default function Clientes() {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    try {
      // Validate with Zod
      clientSchema.parse(formData);

      // Check CPF/CNPJ uniqueness
      const isCpfCnpjTaken = await getClientByCpfCnpj(formData.cpfCnpj);
      if (isCpfCnpjTaken) {
        setErrors({ cpfCnpj: 'CPF/CNPJ já cadastrado.' });
        return;
      }

      await addClient(formData);
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
            placeholder="Telefone (ex: 11987654321)"
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
    </Layout> // Close Layout
  );
}

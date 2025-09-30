import { useState } from 'react';
import Link from 'next/link';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpa erros anteriores
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao registrar.');
      }

      // Redireciona para a página de login após o registro bem-sucedido
      window.location.href = '/'; // Assumindo que '/' é a página de login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-white">Criar Conta</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <FormInput
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Cadastrar
          </Button>
        </form>

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-orange-500 hover:text-orange-400 text-sm">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image'; // Import Image
import { useState } from 'react';
import { loginWithEmail } from '@/services/authService';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6"> {/* Center the image */}
          <Image
            src="/imagem/SafetyTrack_logo.png"
            alt="Safety Track Logo"
            width={400} // Adjust width as needed
            height={400} // Adjust height as needed
          />
        </div>
        
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
            Entrar
          </Button>
        </form>

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        
        <div className="mt-6 text-center">
          <a href="#" className="text-orange-500 hover:text-orange-400 text-sm">Esqueceu a senha?</a>
          <span className="text-gray-400 mx-2">|</span>
          <Link href="/register" className="text-orange-500 hover:text-orange-400 text-sm">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}

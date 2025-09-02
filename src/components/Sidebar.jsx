import React from 'react';
import Link from 'next/link';
import Button from './Button'; // Import Button

const Sidebar = ({ handleLogout }) => { // Receive handleLogout prop
  return (
    <aside className="w-64 bg-gray-900 text-white p-4 space-y-4 flex flex-col"> {/* Add flex-col */}
      <nav className="flex-1"> {/* Make nav take available space */}
        <ul>
          <li>
            <Link href="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/clientes" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
              Clientes
            </Link>
          </li>
          <li>
            <Link href="/veiculos" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
              Veículos
            </Link>
          </li>
          <li>
            <Link href="/os" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
              Ordens de Serviço
            </Link>
          </li>
          {/* Add more navigation links here */}
        </ul>
      </nav>
      <div className="mt-auto"> {/* Push logout button to the bottom */}
        <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white w-full">
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
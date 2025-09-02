import React from 'react';

const Header = ({ userEmail }) => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Safety Track Dashboard</h1>
      {userEmail && <span className="text-sm">Bem-vindo, {userEmail}</span>}
    </header>
  );
};

export default Header;

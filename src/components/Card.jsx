import React from 'react';

const Card = ({ title, children }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;

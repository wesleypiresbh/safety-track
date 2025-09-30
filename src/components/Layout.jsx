import React from 'react'; // No useEffect, useState needed for auth state here
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => { // user prop can be passed if needed from _app.js or page
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/'; // Redirect to login page after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Layout no longer manages auth state or redirects unauthenticated users.
  // Protected pages will handle redirection via getServerSideProps.
  // If user info is needed in Header, it should be passed as a prop to Layout.

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header /> {/* userEmail prop removed, can be passed if Layout receives it */}
      <div className="flex flex-1">
        <Sidebar handleLogout={handleLogout} /> {/* Pass handleLogout to Sidebar */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
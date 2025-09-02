import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { logout } from '@/services/authService'; // Import logout
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        window.location.href = '/'; // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => { // Add handleLogout here
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return null; // Or a loading spinner while checking auth status
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header userEmail={user.email} />
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
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

export default function PrivateLayout() {
  const [isOpen, setIsOpen] = useState(true);

  // Cargar el estado inicial desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-open');
    if (stored !== null) {
      setIsOpen(JSON.parse(stored));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('sidebar-open', JSON.stringify(newState));
  };

  return (
    <div className="flex">
      <Sidebar isOpen={isOpen} toggle={toggleSidebar} />

      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        <Header />

        <main className="pt-16 p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

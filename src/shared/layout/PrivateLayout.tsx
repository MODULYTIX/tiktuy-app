import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function PrivateLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
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
    <>
      {/* Navbar móvil (reemplaza Header + Sidebar en pantallas pequeñas) */}
      <Navbar isOpen={isOpen} open={navOpen} setOpen={setNavOpen} />
      <div className="flex">
        {/* Sidebar: oculto en móvil, visible en desktop */}
        <div className="hidden lg:block">
          <Sidebar isOpen={isOpen} toggle={toggleSidebar} />
        </div>

        {/* Contenido: sin margen en móvil; con margen en desktop según sidebar */}
        <div
          className={`flex-1 transition-all duration-300 ml-0 ${
            isOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}>
          {/* Header: oculto en móvil, visible en desktop */}
          <div className="hidden lg:block">
            <Header />
          </div>

          <main className="pt-16 p-6 bg-gray-50 min-h-screen">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

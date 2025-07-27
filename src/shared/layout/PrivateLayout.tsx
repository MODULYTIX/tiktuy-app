import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function PrivateLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen((v) => !v)} />

      <main
        className={`transition-all duration-300 overflow-y-auto bg-gray-50 p-8
          ${isSidebarOpen ? 'ml-64' : 'ml-20'} flex-1`}>
        <Outlet />
      </main>
    </div>
  );
}

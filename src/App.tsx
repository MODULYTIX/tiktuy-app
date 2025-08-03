import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './auth/context/AuthProvider';
import { NotificationProvider } from './shared/context/notificaciones/NotificationProvider';
import { NotificationBellProvider } from './shared/context/notificacionesBell/NotificationBellProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider> 
          <NotificationBellProvider> 
            <AppRouter />
          </NotificationBellProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

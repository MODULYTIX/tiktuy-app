import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './auth/context/AuthProvider';
import { NotificationProvider } from './shared/context/notificacionesDeskop/NotificationProvider';
import { NotificationBellProvider } from './shared/context/notificacionesBell/NotificationBellProvider';
import { AppNotificationsMobileProvider } from './shared/context/notificacionesMovil/AppNotificationsMobileProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppNotificationsMobileProvider>
          <NotificationProvider>
            <NotificationBellProvider>
              <AppRouter />
            </NotificationBellProvider>
          </NotificationProvider>
        </AppNotificationsMobileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

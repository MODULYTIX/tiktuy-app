import { createContext } from 'react';
import type { NotificationBellContextType } from './types/types';

export const NotificationBellContext = createContext<NotificationBellContextType | undefined>(undefined);

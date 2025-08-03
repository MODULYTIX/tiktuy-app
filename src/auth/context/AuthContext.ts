import { createContext } from 'react';
import type { User } from '@/auth/types/auth.types';

export type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user?: User) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

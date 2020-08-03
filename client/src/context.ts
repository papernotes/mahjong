import { createContext } from 'react';

type ContextType = {
  userId: string;
  userCreated: boolean;
}

export const UserContext = createContext<ContextType>({userId: '', userCreated: false})
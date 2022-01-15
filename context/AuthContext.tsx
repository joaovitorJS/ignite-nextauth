import { createContext, ReactNode, useState } from "react";
import Router from "next/router";
import { setCookie } from "nookies";

import { api } from "../services/api";

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
};  

type AuthProviderProps = {
  children: ReactNode;
}

type User = {
  email: string;
  permitions: string[];
  roles: string[];
};

export const AuthContext =  createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;
  
  async function signIn({email, password}: SignInCredentials) {
   
    try {
      const response = await api.post('sessions', {
        email,
        password
      });  

      const { token, refreshToken, permitions, roles} = response.data;

      const optionsCookie = {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      }

      /* setCookie(ctx, name, value, options)
        ctx no client é null ou undefined
      */
      setCookie(undefined, 'nextauth.token', token, optionsCookie);
      setCookie(undefined, 'nextauth.refreshToken', refreshToken, optionsCookie);

      setUser({
        email,
        permitions,
        roles
      });

      Router.push('/dashboard');

    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}


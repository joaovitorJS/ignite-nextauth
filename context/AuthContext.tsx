import { createContext, ReactNode, useEffect, useState } from "react";
import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";

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
  permissions: string[];
  roles: string[];
};

export const AuthContext =  createContext({} as AuthContextData);

export function signOut() {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshToken');

  Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;
  
  /*
    Carregando as informações do usuário
  */
  useEffect(() => {
    /* parceCookies retorna uma lista de todos o cookies salvos*/
    const { 'nextauth.token': token } = parseCookies();

    if (token) {
      api.get('/me')
        .then(response => {
          const { email, permissions, roles } = response.data; 

          setUser({
            email,
            permissions,
            roles
          });
        })
        .catch(error => {
          signOut();
        });
    }
  }, []);

  async function signIn({email, password}: SignInCredentials) {
   
    try {
      const response = await api.post('sessions', {
        email,
        password
      });  

      const { token, refreshToken, permissions, roles} = response.data;

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
        permissions,
        roles
      });

      Router.push('/dashboard');

      api.defaults.headers['Authorization'] = `Bearer ${token}`;

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


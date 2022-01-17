import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestQueue = []; /*Fila de requisições*/

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
});

/*Interceptador da resposta do servidor*/
api.interceptors.response.use(function (response) {
  return response;
}, function (error: AxiosError) {
  /* Se for Não Autorizado (Unauthorized) */

  if (error.response.status === 401) {
    if (error.response.data?.code === 'token.expired') { /*Se o token estiver expirado*/
      /*Renovar token*/
      cookies = parseCookies(); /*Atualizando os cookies mais recentes*/

      const { 'nextauth.refreshToken': refreshToken } = cookies;

      const originalConfig = error.config;

      if (!isRefreshing) {
        isRefreshing =  true;
        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data; /*Pegando o novo token*/
  
          const optionsCookie = {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/'
          }
  
          /*Atualizando o token salvo nos cookies*/
          setCookie(undefined, 'nextauth.token', token, optionsCookie); 
          setCookie(undefined, 'nextauth.token', response.data.refreshToken, optionsCookie);
  
          /*Atualizando o header da requisição*/
          api.defaults.headers['Authorization'] = `Bearer ${token}`;

          failedRequestQueue.forEach(request => request.onSuccess(token));
          failedRequestQueue = [];
        }).catch(err => {
          failedRequestQueue.forEach(request => request.onFailure(err));
          failedRequestQueue = [];
        }).finally(() => {
          isRefreshing = false;
        });
      }

      return new Promise((resolve, reject) => {
        failedRequestQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`;

            resolve(api(originalConfig));
          },
          onFailure: (err: AxiosError) => {
            reject(err);
          }
        });
      });
    } else { /*Sem uma autenticação feita*/
      /*Deslogar o usuário*/
      signOut();
    }
  }

  return Promise.reject(error);
});
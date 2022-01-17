import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';

let cookies = parseCookies();

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

      api.post('/refresh', {
        refreshToken
      }).then(response => {
        const token = response.data; /*Pegando o novo token*/

        const optionsCookie = {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/'
        }

        /*Atualizando o token salvo nos cookies*/
        setCookie(undefined, 'nextauth.token', token, optionsCookie); 
        setCookie(undefined, 'nextauth.token', response.data.refreshToken, optionsCookie);

        /*Atualizando o header da requisição*/
        api.defaults.headers['Authorization'] = `Bearer ${token}`;
      })
    } else { /*Sem uma autenticação feita*/
      /*Deslogar o usuário*/
    }
  }
});
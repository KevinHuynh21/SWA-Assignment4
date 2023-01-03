import { Subject } from "rxjs";
import axios from "axios";
import { getAuthHeader } from "../utils/auth-header";

const API_URL = "http://localhost:9090/";
const isLogin = new Subject();

export const authentication = {
  getState: () => isLogin.asObservable(),
  setState: (state: boolean) => isLogin.next(state),
};

export function checkAuthentication() {
  if (localStorage.getItem("user")) {
    authentication.setState(true);
    return true;
  }
  return false;
}

export function login(username: string, password: string) {
  return axios
    .post(API_URL + "login", {
      username,
      password,
    })
    .then((response: any) => {
      if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        authentication.setState(true);
      }
      return response.data;
    });
}

export async function getUser(id: number) {
  return axios
    .get(API_URL + `users/${id}`, {
      params: {
        ...getAuthHeader(),
      },
    })
    .then((response) => {
      return response.data;
    });
}

export async function createAccount(username: string, password: string) {
  return axios.post(API_URL + "users", {
    username,
    password,
  });
}

export async function updateAccount(id: number, body: any) {
  return axios
    .patch(
      API_URL + `users/${id}`,
      {
        ...body,
      },
      {
        params: {
          ...getAuthHeader(),
        },
      }
    )
    .then((response: any) => {
      return response.data;
    });
}

export function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("currentGameId");
  authentication.setState(false);
}

export default {
  isLogin,
};

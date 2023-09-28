// import axios from 'axios';
// import {AuthResponse} from "../models/response/AuthResponse";
//
//
// export const API_URL = 'http://localhost:5000/api';
//
//
// const $api = axios.create({
//     withCredentials: true,// для того щоб чіплялись cooke
//     baseURL: API_URL,
// });
//
//
// $api.interceptors.request.use((config) => {
//     config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
//     return config;
// });
//
//
// $api.interceptors.response.use(
//     (config) => {
//         return config;
//     },
//     async (error) => {
//         const originalRequest = error.config;
//         if (error.response.status === 401 && error.congig && !error.congig._isRetry) {
//             // && error.congig && !error.congig._isRetry
//             // originalRequest._isRetry = true;
//             try {
//                 const response = await axios.get<AuthResponse>(`${API_URL}/refresh`, {withCredentials: true});
//                 localStorage.setItem('token', response.data.accessToken);
//                 return $api.request(originalRequest);
//             } catch (e) {
//                 console.log('Не авторизований!!!!!');
//             }
//         }
//         throw error;
//     }
// );
//
// export default $api;



import axios from 'axios';
import { AuthResponse } from '../models/response/AuthResponse';

export const API_URL = 'http://localhost:5000/api';

const $api = axios.create({
    withCredentials: true, // Enable cookies for cross-origin requests
    baseURL: API_URL,
});

$api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToTokenRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];
}

$api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If a refresh request is already in progress, wait for it to finish
                return new Promise<AuthResponse>((resolve) => {
                    subscribeToTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axios(originalRequest));
                    });
                });
            }

            isRefreshing = true;
            originalRequest._retry = true;

            try {
                const response = await axios.get<AuthResponse>(`${API_URL}/refresh`, {
                    withCredentials: true,
                });
                const newToken = response.data.accessToken;
                localStorage.setItem('token', newToken);
                onTokenRefreshed(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
            } catch (e) {
                console.log('Не авторизований!!!!!');
                // Handle token refresh failure (e.g., log out the user)
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default $api;

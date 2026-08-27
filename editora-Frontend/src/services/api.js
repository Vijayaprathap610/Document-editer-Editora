import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:8081/api",

    withCredentials: true,

    headers: {
        "Content-Type": "application/json"
    },

    timeout: 15000
});

// Attach Authorization Bearer token from localStorage if present
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("editora_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        if (!error.response) {
            return Promise.reject({
                ...error,
                userMessage:
                    "Unable to connect to the server. Please check your internet connection."
            });
        }

        if (error.response.status === 401) {
            localStorage.removeItem("editora_token");
            window.dispatchEvent(
                new CustomEvent("editora:unauthorized")
            );
        }

        return Promise.reject(error);
    }
);

export const getApiErrorMessage = (
    error,
    fallback = "Something went wrong"
) => {
    if (error?.userMessage) {
        return error.userMessage;
    }

    return (
        error?.response?.data?.message ||
        fallback
    );
};

export default api;
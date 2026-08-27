import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api",

    withCredentials: true,

    headers: {
        "Content-Type": "application/json"
    },

    timeout: 15000
});

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

        if (
            error.response.status === 401
        ) {
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
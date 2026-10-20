
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const authApi = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        try {
            const response = await authApi.get("/auth/me");
            setAdmin(response.data);
            return response.data;
        } catch {
            setAdmin(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    const login = async (email, password) => {
        const response = await authApi.post("/auth/login", {
            email,
            password,
        });

        setAdmin(response.data.admin);
        return response.data;
    };

    const logout = async () => {
        try {
            await authApi.post("/auth/logout");
        } finally {
            setAdmin(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{ admin, loading, login, logout, refreshSession }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { api, ApiError } from "./api";

export interface AuthUser {
    id: number;
    usuario: string;
    idEmpleado: number;
    admin: boolean;
    permisos: Record<string, boolean>;
}

interface LoginResponse {
    user: AuthUser;
    access_token: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (usuario: string, pass: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "sim_token";
const USER_KEY = "sim_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = window.localStorage.getItem(USER_KEY);
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (stored && token) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                window.localStorage.removeItem(USER_KEY);
                window.localStorage.removeItem(TOKEN_KEY);
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (usuario: string, pass: string) => {
        const data = await api.post<LoginResponse>("/auth/login", { usuario, pass });
        window.localStorage.setItem(TOKEN_KEY, data.access_token);
        window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setUser(null);
        window.location.href = "/login";
    }, []);

    const hasPermission = useCallback(
        (permiso: string) => !!user && (user.admin || !!user.permisos?.[permiso]),
        [user]
    );

    const value = useMemo(
        () => ({ user, loading, login, logout, hasPermission }),
        [user, loading, login, logout, hasPermission]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}

export { ApiError };

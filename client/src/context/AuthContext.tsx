import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to check authentication status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      // Clear any user-specific queries
      queryClient.invalidateQueries();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      // Clear any user-specific queries
      queryClient.invalidateQueries();
    },
  });

  // Login function
  const login = async (username: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ username, password });
    } catch (error) {
      // エラーメッセージをより詳細に変換
      if (error instanceof Error) {
        // APIからのエラーメッセージを適切に処理
        if (error.message.includes("Invalid credentials") || 
            error.message.includes("Incorrect username")) {
          throw new Error("User is not registered");
        } else if (error.message.includes("Incorrect password")) {
          throw new Error("Incorrect password");
        }
      }
      throw error; // その他のエラーは再スロー
    }
  };

  // Register function
  const register = async (username: string, password: string) => {
    try {
      // データをログに記録し、送信する
      console.log("Sending registration data:", { 
        username, 
        password: "********", // セキュリティのために実際のパスワードは表示しない
        passwordLength: password.length
      });
      
      // mutateAsyncを呼び出す際、引数をオブジェクトとして渡す
      const result = await registerMutation.mutateAsync({ 
        username: username.trim(), 
        password: password 
      });
      
      console.log("Registration successful:", result);
      return result;
    } catch (error) {
      console.error("Registration failed in useAuth:", error);
      throw error; // UI側でエラーを処理するために再スローする
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", undefined);
      setUser(null);
      // Clear any user-specific queries
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

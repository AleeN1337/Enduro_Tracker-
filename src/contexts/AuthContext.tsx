import React, { createContext, useState, useEffect, useContext } from "react";
import type { User } from "firebase/auth";
import { ActivityIndicator, View, StyleSheet } from "react-native";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import Firebase at runtime to avoid initializing it during
    // the very first app bundle evaluation. This defers heavy work until after
    // the first render, improving perceived startup time.
    let unsubscribe: any = () => {};
    let mounted = true;

    (async () => {
      try {
        const fb = await import("../config/firebase");
        const authModule = await import("firebase/auth");

        // Subscribe to auth state changes
        unsubscribe = authModule.onAuthStateChanged(
          fb.auth,
          (user: User | null) => {
            if (!mounted) return;
            setUser(user);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  const logout = async () => {
    try {
      const fb = await import("../config/firebase");
      const authModule = await import("firebase/auth");
      await authModule.signOut(fb.auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    logout,
  };

  // Pokaż loading screen podczas sprawdzania stanu auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
});

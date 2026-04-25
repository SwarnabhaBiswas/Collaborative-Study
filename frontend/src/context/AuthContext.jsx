import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../socket";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on refresh
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Update socket auth and connect
      socket.auth.token = storedToken.split(" ")[1];
      socket.connect();
    }

    setLoading(false);
  }, []);

  // LOGIN
  const login = (data) => {
    if (!data?.token || !data?.user) return;

    const bearerToken = `Bearer ${data.token}`;

    localStorage.setItem("token", bearerToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(bearerToken);
    setUser(data.user);

    // Update socket auth and connect
    socket.auth.token = data.token;
    socket.connect();
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout ,loading}}>
      {children}
    </AuthContext.Provider>
  );
}
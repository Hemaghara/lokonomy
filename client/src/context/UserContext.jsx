import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "./LocationContext";
import { authService } from "../services";
import { connectSocket, disconnectSocket } from "../services/socket";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("lokonomy_user");
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      return null;
    }
  });

  const { setDistrict, setTaluka } = useLocation();

  useEffect(() => {
    if (user && (user.id || user._id)) {
      connectSocket({ userId: user.id || user._id, isAdmin: false, token: user.token });
    }

    return () => {
      if (!user) {
        disconnectSocket();
      }
    };
  }, [user]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const newUser = prev ? { ...prev, ...updates } : updates;
      localStorage.setItem("lokonomy_user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (window?.location?.pathname?.startsWith("/admin")) return;

      if (user && user.token) {
        try {
          const res = await authService.getMe();
          if (res.data.success) {
            updateUser(res.data.user);
          }
        } catch (err) {
          console.log("Session expired or invalid");
          // logout();
        }
      }
    };
    fetchMe();
  }, [user?.token, updateUser]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("lokonomy_user", JSON.stringify(userData));

    if (userData.district) setDistrict(userData.district);
    if (userData.taluka) setTaluka(userData.taluka);

    if (userData.id || userData._id) {
      connectSocket({ userId: userData.id || userData._id, isAdmin: false, token: userData.token });
    }
  };

  const logout = async () => {
    try {
      if (user && user.token) {
        await authService.logout();
      }
    } catch (err) {
      console.error("Failed to logout on server:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("lokonomy_user");
      disconnectSocket();
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

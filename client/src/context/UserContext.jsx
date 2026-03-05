import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "./LocationContext";
import { authService } from "../services";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("lokonomy_user");
    return saved ? JSON.parse(saved) : null;
  });

  const { setDistrict, setTaluka } = useLocation();

  useEffect(() => {
    const fetchMe = async () => {
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
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("lokonomy_user", JSON.stringify(userData));

    if (userData.district) setDistrict(userData.district);
    if (userData.taluka) setTaluka(userData.taluka);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lokonomy_user");
    // setDistrict("");
    // setTaluka("");
  };

  const updateUser = (updates) => {
    const newUser = { ...user, ...updates };
    setUser(newUser);
    localStorage.setItem("lokonomy_user", JSON.stringify(newUser));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

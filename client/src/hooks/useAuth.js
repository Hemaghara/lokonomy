import { useUser } from "../context/UserContext";
import { authService } from "../services";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const { user, login: contextLogin, logout: contextLogout } = useUser();
  const navigate = useNavigate();

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (data) => {
    try {
      const response = await authService.verifyOtp(data);
      if (response.data.success) {
        contextLogin({
          ...response.data.user,
          token: response.data.token,
        });
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.data.token) {
        contextLogin({
          ...userData,
          token: response.data.token,
        });
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    contextLogout();
    navigate("/");
  };

  return {
    user,
    isAuthenticated: !!user?.token,
    login,
    verifyOtp,
    register,
    logout,
  };
};

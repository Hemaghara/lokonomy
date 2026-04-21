import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook for standardizing admin data fetching patterns.
 * @param {Function} fetchFn - The async function that returns the API response.
 * @param {Array} dependencies - Dependencies that should trigger a refetch.
 * @param {Object} options - Configuration options (autoFetch, errorMessage, onSuccess).
 */
const useAdminFetch = (fetchFn, dependencies = [], options = {}) => {
  const {
    autoFetch = true,
    errorMessage = "Failed to fetch data",
    onSuccess = null,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFn(...args);
        const result = response.data;
        setData(result);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        const message = err.response?.data?.message || errorMessage;
        toast.error(message);

        if (err.response?.status === 401) {
          navigate("/admin/login");
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, errorMessage, onSuccess, navigate],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [...dependencies, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
};

export default useAdminFetch;

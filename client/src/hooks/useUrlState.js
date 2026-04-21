import { useSearchParams } from "react-router-dom";
import { useCallback, useRef } from "react";

export const useUrlState = (initialState = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimer = useRef(null);

  const getParam = useCallback(
    (key, defaultValue = "") => {
      const val = searchParams.get(key);
      if (val === null) return initialState[key] || defaultValue;
      return val;
    },
    [searchParams, initialState],
  );

  const setParam = useCallback(
    (key, value, options = {}) => {
      const { replace = true, debounce = 0 } = options;

      const update = () => {
        const newParams = new URLSearchParams(searchParams);
        if (value === undefined || value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
        setSearchParams(newParams, { replace });
      };

      if (debounce > 0) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(update, debounce);
      } else {
        update();
      }
    },
    [searchParams, setSearchParams],
  );

  const setParams = useCallback(
    (paramsObj, options = { replace: true }) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(paramsObj).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams, options);
    },
    [searchParams, setSearchParams],
  );

  return { getParam, setParam, setParams, searchParams };
};

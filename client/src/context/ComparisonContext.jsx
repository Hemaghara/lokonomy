import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState(() => {
    const saved = localStorage.getItem("lokonomy_comparison");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("lokonomy_comparison", JSON.stringify(selectedIds));
  }, [selectedIds]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 businesses at a time");
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <ComparisonContext.Provider
      value={{ selectedIds, toggleSelection, clearSelection }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};

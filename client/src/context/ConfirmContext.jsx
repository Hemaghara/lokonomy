import React, { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    isDanger: false,
    onConfirm: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || "Confirm Action",
        description: options.description || "Are you sure you want to proceed?",
        confirmLabel: options.confirmLabel || "Confirm",
        isDanger: options.isDanger || false,
        onConfirm: () => {
          if (options.onConfirm) options.onConfirm();
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, closeConfirm, modalState }}>
      {children}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
};

export const useConfirmState = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirmState must be used within a ConfirmProvider");
  }
  return context;
};

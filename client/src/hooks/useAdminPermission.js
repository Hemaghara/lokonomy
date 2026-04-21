import { useMemo } from "react";
const useAdminPermission = () => {
  const adminInfo = useMemo(() => {
    try {
      const stored = localStorage.getItem("adminInfo");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const role = adminInfo?.role || adminInfo?.user?.role || "moderator";

  const permissions = useMemo(
    () => ({
      isSuperAdmin: role === "superadmin",
      isModerator: role === "moderator" || role === "superadmin",
      isSupport: role === "support" || role === "superadmin",
      isFinance: role === "finance" || role === "superadmin",

      canManageUsers: role === "superadmin",
      canViewAnalytics: role === "superadmin" || role === "finance",
      canManageContent: role === "superadmin" || role === "moderator",
      canManageSupport: role === "superadmin" || role === "support",
      canManageSettings: role === "superadmin",
    }),
    [role],
  );

  return { ...permissions, role };
};

export default useAdminPermission;

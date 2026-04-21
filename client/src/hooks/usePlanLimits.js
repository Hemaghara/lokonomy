import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { subscriptionService } from "../services";


export const usePlanLimits = () => {
  const { user } = useUser();
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await subscriptionService.getPlans();
        const plans = response.data.plans;
        const planSlug = user?.subscription?.plan || "free";
        const currentPlan = plans[planSlug] || plans["free"];
        
        if (currentPlan) {
          setLimits(currentPlan.limits);
        }
      } catch (err) {
        console.error("Error fetching plan limits:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLimits();
    } else {
      setLoading(false);
    }
  }, [user?.subscription?.plan]);

  return { limits, loading };
};

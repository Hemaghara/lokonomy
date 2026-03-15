import api from "./api";

const VAPID_PUBLIC_KEY = "BNPinvc4YI-Wn-O0J2j7HHEE5fQpb9jMkdeJikmrhGBD4oazYMGVjRuu4hcVq6S2yuABiSOa1diufLdGdWH_FIU";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (Notification.permission === "denied") {
      console.warn("Notification permission denied.");
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const response = await api.post("/push/subscribe", {
      subscription,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    });

    return response.data;
  } catch (error) {
    console.error("Error subscribing to push:", error);
    throw error;
  }
};

export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await api.post("/push/unsubscribe", {
        endpoint: subscription.endpoint,
      });
    }
    return true;
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    throw error;
  }
};

export const toggleNotifications = async (enabled) => {
  try {
    const response = await api.put("/push/toggle", {
      notificationsEnabled: enabled,
    });
    return response.data;
  } catch (error) {
    console.error("Error toggling notifications:", error);
    throw error;
  }
};

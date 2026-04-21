/**
 * Serializes a user object for API responses.
 * This ensures consistency across different controllers and avoid duplicating fields.
 */
const serializeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    district: user.district,
    taluka: user.taluka,
    latitude: user.latitude,
    longitude: user.longitude,
    locationName: user.locationName,
    locationPermission: user.locationPermission,
    upiId: user.upiId,
    paymentQrCode: user.paymentQrCode,
    bankName: user.bankName,
    ifscCode: user.ifscCode,
    branch: user.branch,
    accountNumber: user.accountNumber,
    phoneNumber: user.phoneNumber,
    subscription: user.subscription
      ? {
          ...(user.subscription.toObject
            ? user.subscription.toObject()
            : user.subscription),
          durationMonths: user.subscription.durationMonths,
        }
      : null,
    usage: user.usage,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    referralRewards: user.referralRewards,
    loyaltyPoints: user.loyaltyPoints || 0,
    lastLoginDate: user.lastLoginDate,
  };
};

module.exports = { serializeUser };

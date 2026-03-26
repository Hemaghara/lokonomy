const cron = require("node-cron");
const Booking = require("../models/Booking");
const { sendPushNotification } = require("../utils/pushService");
const Business = require("../models/Business");

const startBookingRemindersCron = () => {
  cron.schedule("0 * * * *", async () => {
    const now = new Date();

    console.log(
      `[Cron] Running booking reminders check at ${now.toLocaleString()}`,
    );

    try {
      const bookings = await Booking.find({
        status: "confirmed",
        $or: [{ reminderSent24h: false }, { reminderSent1h: false }],
      })
        .populate("businessId")
        .populate("userId");

      for (const booking of bookings) {
        try {
          if (
            !booking.userId ||
            booking.userId.appointmentRemindersEnabled === false
          ) {
            continue;
          }
          const bookingDateTime = new Date(
            `${booking.date}T${booking.timeSlot}`,
          );

          if (isNaN(bookingDateTime.getTime())) {
            console.error(
              `[Cron] Invalid date/time for booking ${booking._id}: ${booking.date} ${booking.timeSlot}`,
            );
            continue;
          }

          const diffMs = bookingDateTime - now;
          const diffHrs = diffMs / (1000 * 60 * 60);
          if (!booking.reminderSent24h && diffHrs > 23 && diffHrs <= 25) {
            console.log(
              `[Cron] Sending 24h reminder for booking ${booking._id}`,
            );
            await sendPushNotification(booking.userId._id, {
              title: "Upcoming Appointment Reminder",
              body: `Your appointment for ${booking.serviceName} at ${booking.businessId?.businessName || "the business"} is in 24 hours (Tomorrow, ${booking.date} at ${booking.timeSlot}).`,
              data: { url: "/profile" },
            });
            booking.reminderSent24h = true;
            await booking.save();
          }
          if (!booking.reminderSent1h && diffHrs > 0 && diffHrs <= 1.5) {
            console.log(
              `[Cron] Sending 1h reminder for booking ${booking._id}`,
            );
            await sendPushNotification(booking.userId._id, {
              title: "Appointment Reminder (1 Hour)",
              body: `Your appointment for ${booking.serviceName} at ${booking.businessId?.businessName || "the business"} is in 1 hour (${booking.timeSlot}). See you soon!`,
              data: { url: "/profile" },
            });
            booking.reminderSent1h = true;
            await booking.save();
          }
        } catch (error) {
          console.error(
            `[Cron] Error processing booking ${booking._id}:`,
            error,
          );
        }
      }
    } catch (err) {
      console.error(
        "[Cron] Error during booking reminders query:",
        err.message,
      );
    }
  });

  console.log("[Cron] Booking reminders cron job scheduled (hourly).");
};

module.exports = { startBookingRemindersCron };

const cron = require("node-cron");
const Booking = require("../models/Booking");
const { sendPushNotification } = require("../utils/pushService");
const { createNotification } = require("../controllers/notificationController");
const Business = require("../models/Business");

const startBookingRemindersCron = () => {
  cron.schedule("0 * * * *", async () => {
    const now = new Date();

    console.log(
      `[Cron] Running booking reminders check at ${now.toLocaleString()}`,
    );

    try {
      const maxDate = new Date(now.getTime() + 26 * 60 * 60 * 1000);
      const cursor = Booking.find({
        status: "confirmed",
        $or: [{ reminderSent24h: false }, { reminderSent1h: false }],

        date: { $lte: maxDate.toISOString().split("T")[0] },
      })
        .populate("businessId")
        .populate("userId")
        .cursor();

      for (
        let booking = await cursor.next();
        booking != null;
        booking = await cursor.next()
      ) {
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

          if (isNaN(bookingDateTime.getTime())) continue;

          const diffMs = bookingDateTime - now;
          const diffHrs = diffMs / 3600000;

          if (!booking.reminderSent24h && diffHrs > 23 && diffHrs <= 25) {
            await sendPushNotification(booking.userId._id, {
              title: "Upcoming Appointment Reminder",
              body: `Your appointment for ${booking.serviceName} at ${booking.businessId?.businessName || "the business"} is in 24 hours (Tomorrow, ${booking.date} at ${booking.timeSlot}).`,
              data: { url: "/profile" },
            });
            await createNotification({
              recipientId: booking.userId._id,
              type: "booking",
              title: "Appointment Tomorrow",
              message: `Your appointment for ${booking.serviceName} at ${booking.businessId?.businessName || "the business"} is tomorrow at ${booking.timeSlot}.`,
              actionUrl: `/business/${booking.businessId?._id}`,
              metadata: { bookingId: booking._id },
            });
            booking.reminderSent24h = true;
            await booking.save();
          }

          if (!booking.reminderSent1h && diffHrs > 0 && diffHrs <= 1.5) {
            await sendPushNotification(booking.userId._id, {
              title: "Appointment Reminder (1 Hour)",
              body: `Your appointment for ${booking.serviceName} at ${booking.businessId?.businessName || "the business"} is in 1 hour (${booking.timeSlot}).`,
              data: { url: "/profile" },
            });
            await createNotification({
              recipientId: booking.userId._id,
              type: "booking",
              title: "Appointment in 1 Hour",
              message: `Your appointment for ${booking.serviceName} at ${booking.businessId?.businessName || "the business"} starts at ${booking.timeSlot}.`,
              actionUrl: `/business/${booking.businessId?._id}`,
              metadata: { bookingId: booking._id },
            });
            booking.reminderSent1h = true;
            await booking.save();
          }
        } catch (error) {
          console.error(
            `[Cron] Error processing booking ${booking._id}:`,
            error.message,
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

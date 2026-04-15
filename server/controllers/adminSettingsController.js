const Settings = require("../models/Settings");

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(updateData);
    } else {
      Object.assign(settings, updateData);
    }

    await settings.save();
    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.toggleMaintenanceMode = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      const newSettings = await Settings.create({ maintenanceMode: true });
      return res.json({
        message: "Maintenance mode enabled",
        settings: newSettings,
      });
    }

    settings.maintenanceMode = !settings.maintenanceMode;
    await settings.save();
    res.json({
      message: `Maintenance mode ${settings.maintenanceMode ? "enabled" : "disabled"}`,
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

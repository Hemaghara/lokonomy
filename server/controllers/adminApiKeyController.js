const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");

const generateKey = () => {
  return "lk_" + crypto.randomBytes(32).toString("hex");
};

exports.getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .select("-key")
      .lean();
    res.json(keys);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createApiKey = async (req, res) => {
  try {
    const { name, scopes, rateLimit, expiresAt } = req.body;
    const rawKey = generateKey();
    const prefix = rawKey.substring(0, 12);

    const apiKey = await ApiKey.create({
      name,
      key: rawKey,
      prefix,
      scopes: scopes || [],
      rateLimit: rateLimit || 1000,
      expiresAt: expiresAt || null,
      createdBy: req.admin._id,
    });

    res.status(201).json({
      message: "API key created. Save it now — it won't be shown again.",
      apiKey: {
        _id: apiKey._id,
        name: apiKey.name,
        key: rawKey,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.revokeApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { status: "revoked" },
      { new: true },
    ).select("-key");
    if (!apiKey) return res.status(404).json({ message: "API key not found" });
    res.json({ message: "API key revoked", apiKey });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteApiKey = async (req, res) => {
  try {
    await ApiKey.findByIdAndDelete(req.params.id);
    res.json({ message: "API key deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getApiKeyLogs = async (req, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id)
      .select("name prefix usageLogs usageCount lastUsed")
      .lean();
    if (!apiKey) return res.status(404).json({ message: "API key not found" });
    res.json(apiKey);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateRateLimit = async (req, res) => {
  try {
    const { rateLimit } = req.body;
    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { rateLimit },
      { new: true },
    ).select("-key");
    if (!apiKey) return res.status(404).json({ message: "API key not found" });
    res.json({ message: "Rate limit updated", apiKey });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

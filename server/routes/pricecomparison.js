const express = require("express");
const router = express.Router();
const { comparePrices } = require("../controllers/priceComparisonController");

router.get("/", comparePrices);

module.exports = router;

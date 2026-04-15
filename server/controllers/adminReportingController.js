const ExcelJS = require("exceljs");
const User = require("../models/User");
const Order = require("../models/Order");
const Business = require("../models/Business");

exports.exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type.toUpperCase());

    let data = [];
    let columns = [];

    if (type === "users") {
      data = await User.find().lean();
      columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phoneNumber", width: 15 },
        { header: "District", key: "district", width: 20 },
        { header: "Joined At", key: "createdAt", width: 20 },
      ];
    } else if (type === "orders") {
      data = await Order.find()
        .populate("buyer", "name")
        .populate("seller", "name")
        .lean();
      columns = [
        { header: "Order ID", key: "_id", width: 25 },
        { header: "Price", key: "price", width: 15 },
        { header: "Status", key: "orderStatus", width: 15 },
        { header: "Buyer", key: "buyerName", width: 25 },
        { header: "Seller", key: "sellerName", width: 25 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];
      data = data.map((o) => ({
        ...o,
        buyerName: o.buyer?.name,
        sellerName: o.seller?.name,
      }));
    } else if (type === "businesses") {
      data = await Business.find().lean();
      columns = [
        { header: "Business Name", key: "businessName", width: 30 },
        { header: "Owner", key: "ownerName", width: 25 },
        { header: "Category", key: "mainCategory", width: 20 },
        { header: "District", key: "district", width: 20 },
        { header: "Verified", key: "isVerified", width: 15 },
      ];
    }

    sheet.columns = columns;
    sheet.addRows(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=lokonomy_${type}_report.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://hemaghara:hemaghara@cluster0.gkfxzbm.mongodb.net/?appName=Cluster0";

const businessSchema = new mongoose.Schema({}, { strict: false });
const Business = mongoose.model('Business', businessSchema);

async function checkBakeries() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");
    const bakeries = await Business.find({
      $or: [
        { businessName: { $regex: 'bakery', $options: 'i' } },
        { mainCategory: { $regex: 'bakery', $options: 'i' } },
        { subCategory: { $regex: 'bakery', $options: 'i' } }
      ]
    });
    console.log(`Found ${bakeries.length} bakeries:`);
    bakeries.forEach(b => {
      console.log(`- ${b.businessName} (Category: ${b.mainCategory}, Sub: ${b.subCategory}) in ${b.district}, ${b.taluka}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBakeries();

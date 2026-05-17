const mongoose = require('mongoose');
const Story = require('./models/Story');
require('dotenv').config();

async function checkStories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect("mongodb+srv://hemaghara:hemaghara@cluster0.gkfxzbm.mongodb.net/?appName=Cluster0");
    console.log('Connected!');

    const count = await Story.countDocuments();
    console.log(`Total stories in DB: ${count}`);

    const latestStories = await Story.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log('\n--- Latest 5 Stories ---');
    latestStories.forEach((s, i) => {
      console.log(`\n[${i+1}] Title: ${s.title}`);
      console.log(`    ID: ${s._id}`);
      console.log(`    District: ${s.district}`);
      console.log(`    Location: ${JSON.stringify(s.location)}`);
      console.log(`    ExpiresAt: ${s.expiresAt}`);
      console.log(`    IsHighlighted: ${s.isHighlighted}`);
      console.log(`    CreatedAt: ${s.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkStories();

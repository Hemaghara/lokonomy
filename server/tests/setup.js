const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri());
  try {
    await mongoose.connection.db.admin().command({
      setParameter: 1,
      maxTransactionLockRequestTimeoutMillis: 5000,
    });
  } catch (err) {
    console.warn("Could not set maxTransactionLockRequestTimeoutMillis:", err.message);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

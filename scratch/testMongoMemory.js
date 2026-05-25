const { MongoMemoryReplSet } = require("mongodb-memory-server");
async function main() {
  try {
    console.log("Starting replica set...");
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    console.log("Replica set URI:", replSet.getUri());
    await replSet.stop();
    console.log("Success!");
  } catch (e) {
    console.error("Error starting replica set:", e);
  }
}
main();

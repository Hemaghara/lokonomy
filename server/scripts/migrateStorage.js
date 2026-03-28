require("dotenv").config();
const CloudinaryAdapter = require("../services/storage/CloudinaryAdapter");
const S3Adapter = require("../services/storage/S3Adapter");
const https = require("https");

const downloadStreamToBuffer = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const data = [];
        res.on("data", (chunk) => data.push(chunk));
        res.on("end", () => resolve(Buffer.concat(data)));
      })
      .on("error", (err) => reject(err));
  });
};

const migrate = async () => {
  console.log("Starting Global Storage Migration...\n");

  const source = new CloudinaryAdapter();
  const destination = new S3Adapter();

  try {
    console.log("Scanning Source Directory (Cloudinary->lokonomy/*)...");
    const files = await source.list("lokonomy");

    console.log(`Found ${files.length} files to migrate.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const fileUrl of files) {
      try {
        // Extract the logical path from the URL.
        // e.g., "https://res.cloudinary.com/.../upload/v1234/lokonomy/market/item.webp"
        // -> "lokonomy/market/item.webp"
        const pathMatch = fileUrl.split("/upload/")[1];
        const logicalPath = pathMatch.replace(/^v\d+\//, "");

        console.log(`⏳ Migrating: ${logicalPath}`);

        const buffer = await downloadStreamToBuffer(fileUrl);

        await destination.upload(buffer, logicalPath);

        console.log(`Success!`);
        successCount++;
      } catch (err) {
        console.error(`Failed: ${fileUrl}`, err.message);
        failCount++;
      }
    }

    console.log("\n==================================");
    console.log("MIGRATION COMPLETE");
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log("==================================");
    console.log(
      "\nYou can now safely change 'STORAGE_PROVIDER' in your .env to switch traffic over to the new cloud provider.",
    );
    process.exit(0);
  } catch (err) {
    console.error("Critical Migration Error:", err);
    process.exit(1);
  }
};

migrate();

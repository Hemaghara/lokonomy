const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

class S3Adapter {
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
  }

  async upload(buffer, path) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
      ContentType: "image/webp",
    });

    await this.client.send(command);
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${path}`;
  }
}

module.exports = S3Adapter;

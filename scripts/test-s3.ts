const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testS3() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "us-east-2";
    const bucketName = process.env.AWS_S3_BUCKET || "ocr-facturas";

    console.log("Testing S3 with:");
    console.log("Region:", region);
    console.log("Bucket:", bucketName);
    console.log("Key ID:", accessKeyId);

    if (!accessKeyId || !secretAccessKey) {
        console.error("Missing AWS credentials in .env");
        process.exit(1);
    }

    const s3Client = new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const testKey = `test-${Date.now()}.txt`;
    const testContent = "Hello from CondoManager Pro test script!";

    try {
        console.log("Uploading test file...");
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ContentType: "text/plain",
            ACL: "public-read",
        });

        await s3Client.send(command);
        console.log("Upload successful!");

        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${testKey}`;
        console.log("Test URL:", url);
        console.log("Please try to open this URL in your browser to verify public access.");

    } catch (error) {
        console.error("S3 Test Failed:", error);
    }
}

testS3();

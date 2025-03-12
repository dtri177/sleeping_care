const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const Sound = require('./models/Sound')
// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("DB Connection Error:", err));

// Sound Model


const folderPath = path.join(__dirname, "public/img/covers");

const uploadImages = async () => {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    console.log(`Uploading: ${filePath}`);
    
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "covers" // Cloudinary folder
      });

      // Update MongoDB where images match the local filename
      await Sound.findOneAndUpdate({ images: `${file}` }, {
        images: result.secure_url
      });

      console.log(`✔ Uploaded & updated: ${file} -> ${result.secure_url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
    }
  }

  console.log("✅ All images uploaded and database updated!");
  mongoose.disconnect();
};

uploadImages();

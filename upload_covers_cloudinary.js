const fs = require("fs");
const path = require("path");
const cloudinary = require("./config/cloudiary"); // Use the existing cloudinary config
const mongoose = require("mongoose");
const connectDB = require("./config/db"); // Use your database connection config
const Sound = require("./models/Sound"); // Import the Sound model
require("dotenv").config();

// Connect to the database
connectDB();

const folderPath = path.join(__dirname, "public/img/covers"); 
// Adjust path to match project structure

// Function to upload images to Cloudinary
const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `sound_covers/${new Date().getFullYear()}`, // Folder in Cloudinary
    });
    return result.secure_url; // Cloudinary URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

// Function to update the database
const updateDatabase = async () => {
  try {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);

      // Find all sounds that have this image filename
      const sounds = await Sound.find({ images: file });

      if (sounds.length > 0) {
        console.log(`Uploading ${file}...`);
        const cloudinaryUrl = await uploadImage(filePath);

        if (cloudinaryUrl) {
          // Update all matching sounds
          await Sound.updateMany({ images: file }, { $set: { images: cloudinaryUrl } });
          console.log(`Updated ${file} -> ${cloudinaryUrl}`);
        }
      }
    }
    console.log("All images uploaded and database updated.");
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the update process
updateDatabase();

const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
dotenv.config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.API_AI_KEY);
    
    // This is a workaround since the Google AI Node.js client doesn't have a direct listModels method
    // Create a temporary model instance just to test connection
    const tempModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Test if we can access the model
    const response = await tempModel.generateContent("Test");
    console.log("Connection successful. Model is working.");
    
    // Note: If you need to actually list all available models, you'd need to use the REST API directly
    // or check the Google Cloud Console
  } catch (error) {
    console.error("Error:", error.message);
    if (error.status === 404) {
      console.log("Model not found. Try using a different model name.");
    } else if (error.status === 403) {
      console.log("Permission denied. Check API key and account permissions.");
    }
  }
}

listModels();
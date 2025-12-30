const functions = require("firebase-functions");
const vision = require("@google-cloud/vision");

// Create Vision client
const client = new vision.ImageAnnotatorClient();

// Callable function
exports.analyzeImage = functions.https.onCall(async (data, context) => {
  const imageUrl = data.imageUrl;

  if (!imageUrl) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Image URL is required"
    );
  }

  // Call Vision API
  const [result] = await client.labelDetection(imageUrl);
  const labels = result.labelAnnotations.map(label => label.description);

  return { labels };
});

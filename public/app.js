// 🔹 Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-functions.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// 🔹 Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDx49M5ImOjRKbZb4WmYdJrJ2jt9JZ1sSs",
  authDomain: "smart-lost-found-2d107.firebaseapp.com",
  projectId: "smart-lost-found-2d107",
  storageBucket: "smart-lost-found-2d107.firebasestorage.app"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "us-central1");

// 🔹 FORCE correct storage bucket (important)
const storage = getStorage(
  app,
  "gs://smart-lost-found-2d107.firebasestorage.app"
);


console.log("APP.JS LOADED");

// 🔐 Login (anonymous)
window.login = async function () {
  try {
    const userCred = await signInAnonymously(auth);
    console.log("LOGGED IN USER 👉", userCred.user.uid);
    alert("Logged in");
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    alert("Login failed");
  }
};

// 🤖 Analyze Item (Upload → Vision → Firestore)
window.analyzeItem = async function () {
  console.log("🔥 analyzeItem CALLED");

  const fileInput = document.getElementById("imageFile");
  const file = fileInput?.files[0];
  const location = document.getElementById("location")?.value;

  console.log("📁 FILE OBJECT:", file);
  console.log("📍 LOCATION:", location);



  if (!auth.currentUser) {
    alert("Please login first");
    return;
  }

  if (!file || !location) {
    alert("Please select an image and enter location");
    return;
  }

  try {
    alert("Uploading image...");

    // 📤 Upload image to Storage
    const storageRef = ref(
      storage,
      `found_items/${Date.now()}_${file.name}`
    );

    console.log("STORAGE PATH 👉", storageRef.fullPath);

    await uploadBytes(storageRef, file);
    console.log("UPLOAD FINISHED");

    // 🔗 Get download URL
    const imageUrl = await getDownloadURL(storageRef);
    console.log("DOWNLOAD URL 👉", imageUrl);

    alert("Image uploaded. Running AI...");

    // 🤖 Call Vision AI Cloud Function
    const analyzeImage = httpsCallable(functions, "analyzeImage");
    const result = await analyzeImage({ imageUrl });

    const labels = result.data.labels || [];
    console.log("AI LABELS 👉", labels);

    alert("AI Labels:\n" + labels.join(", "));

    // 🗄 Save to Firestore
    await addDoc(collection(db, "found_items"), {
      imageUrl,
      location,
      labels,
      createdAt: serverTimestamp()
    });

    alert("Saved to Firestore!");

  } catch (error) {
    console.error("FINAL ERROR 👉", error);
    alert("ERROR:\n" + (error.message || error));
  }
};

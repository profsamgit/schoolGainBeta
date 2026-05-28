const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyC4wFleml416IHoKklvNg0MZJI2_q0WgKA",
  authDomain: "schoolgainbd.firebaseapp.com",
  projectId: "schoolgainbd",
  storageBucket: "schoolgainbd.firebasestorage.app",
  messagingSenderId: "726450154508",
  appId: "1:726450154508:web:d2404849df9e3734605229",
  measurementId: "G-LTVJLCVFV0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log("Fetching terminals...");
  const snapshot = await getDocs(collection(db, "terminals"));
  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log("-----------------------------------------");
  });
}

check().catch(console.error);

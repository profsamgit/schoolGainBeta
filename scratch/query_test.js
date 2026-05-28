const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

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
  const terminalId = "SG-HW-MAC-0A002700000D";
  console.log("Querying for:", terminalId);
  const q = query(collection(db, "terminals"), where("hardwareId", "==", terminalId));
  const querySnapshot = await getDocs(q);
  console.log("Empty?", querySnapshot.empty);
  if (!querySnapshot.empty) {
    console.log("Found!", querySnapshot.docs[0].id, querySnapshot.docs[0].data());
  }
}

check().catch(console.error);

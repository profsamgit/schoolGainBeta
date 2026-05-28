const admin = require('firebase-admin');

// Initialize with environment variables or default config
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'schoolgainbd'
  });
}

const db = admin.firestore();

db.collection('terminals').get().then(snapshot => {
  snapshot.forEach(doc => {
    console.log(`Terminal ID: ${doc.id}`);
    console.log(`Location: ${doc.data().location}`);
    console.log(`Status: ${doc.data().status}`);
    console.log(`Settings:`, JSON.stringify(doc.data().settings, null, 2));
    console.log("-----------------------------------------");
  });
  process.exit(0);
}).catch(err => {
  console.error("Error reading terminals:", err);
  process.exit(1);
});

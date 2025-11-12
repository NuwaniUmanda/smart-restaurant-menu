const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("./firebase-service-account.json")) });

async function setAdminRole(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { isAdmin: true });
    console.log(`Admin role set for user ${uid}`);
  } catch (error) {
    console.error("Error setting admin role:", error);
  }
}

// Replace with the actual UID from Firebase Authentication
// You can find this UID in Firebase Console > Authentication > Users
setAdminRole("YOUR_ACTUAL_USER_UID_HERE");
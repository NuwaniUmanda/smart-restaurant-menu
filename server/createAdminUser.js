const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("./firebase-service-account.json")) });

async function createAdminUser() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'admin@restaurant.com',
      password: 'admin123',
      displayName: 'Restaurant Admin',
      emailVerified: true
    });

    console.log('Successfully created new user:', userRecord.uid);

    await admin.auth().setCustomUserClaims(userRecord.uid, { isAdmin: true });
    console.log('Admin role set for user:', userRecord.uid);

    console.log('\n✅ Admin user created successfully!');
    console.log('Email: admin@restaurant.com');
    console.log('Password: admin123');
    console.log('UID:', userRecord.uid);

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists. Getting UID...');
      const userRecord = await admin.auth().getUserByEmail('admin@restaurant.com');
      console.log('Existing user UID:', userRecord.uid);
      await admin.auth().setCustomUserClaims(userRecord.uid, { isAdmin: true });
      console.log('Admin role set for existing user:', userRecord.uid);
      console.log('\n✅ Admin role set for existing user!');
      console.log('Email: admin@restaurant.com');
      console.log('Password: admin123');
      console.log('UID:', userRecord.uid);
    } else {
      console.error('Error creating admin user:', error);
    }
  }
}

createAdminUser();
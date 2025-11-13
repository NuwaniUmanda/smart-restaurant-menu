const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-service-account.json')),
    projectId: 'resturant-menu-eb399',
  });
}

const db = admin.firestore();

// Sample menu items
const sampleMenuItems = [
  {
    name: 'Margherita Pizza',
    description: 'Classic tomato sauce with mozzarella cheese',
    category: 'Pizza',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
    available: true,
    hasSizes: false,
    tags: ['vegetarian', 'pizza'],
    availableAmount: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Chicken Burger',
    description: 'Grilled chicken breast with lettuce and tomato',
    category: 'Burgers',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    available: true,
    hasSizes: false,
    tags: ['chicken', 'burger'],
    availableAmount: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with Caesar dressing',
    category: 'Salads',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    available: true,
    hasSizes: false,
    tags: ['vegetarian', 'salad'],
    availableAmount: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Coffee',
    description: 'Freshly brewed coffee',
    category: 'Beverages',
    hasSizes: true,
    sizeOptions: [
      { name: 'Small', price: 2.99, available: true, code: 'S' },
      { name: 'Medium', price: 3.99, available: true, code: 'M' },
      { name: 'Large', price: 4.99, available: true, code: 'L' }
    ],
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    available: true,
    tags: ['beverage', 'hot'],
    availableAmount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function addTestData() {
  try {
    console.log('Adding test menu items to Firestore...');
    
    const batch = db.batch();
    
    sampleMenuItems.forEach((item, index) => {
      const docRef = db.collection('restaurantMenu').doc();
      batch.set(docRef, item);
      console.log(`Preparing to add: ${item.name}`);
    });
    
    await batch.commit();
    console.log('Successfully added test menu items!');
    
    // Verify the data was added
    const snapshot = await db.collection('restaurantMenu').get();
    console.log(`Total menu items in database: ${snapshot.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

addTestData();

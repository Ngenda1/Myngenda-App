/**
 * Storage Enhancement for Myngenda
 * 
 * This module adds getUserByEmail method and enhances password handling
 * to fix the registration/login disconnect issue.
 */

const bcrypt = require('bcryptjs');

// Add this function to your server/index.js or server/index.ts file
function enhanceStorage(storage, db, users, eq) {
  // Check if storage already has getUserByEmail method
  if (!storage.getUserByEmail) {
    // Add getUserByEmail method
    storage.getUserByEmail = async function(email) {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    };
    
    console.log('Added getUserByEmail method to storage');
  }
  
  // Save the original createUser method
  const originalCreateUser = storage.createUser;
  
  // Enhance createUser to handle password hashing
  storage.createUser = async function(userData) {
    let userToInsert = {...userData};
    
    // Only hash password if it's not already hashed
    if (userToInsert.password && !userToInsert.password.startsWith('$2a$') && !userToInsert.password.startsWith('$2b$')) {
      try {
        const salt = await bcrypt.genSalt(10);
        userToInsert.password = await bcrypt.hash(userToInsert.password, salt);
        console.log('Password hashed for new user');
      } catch (error) {
        console.error('Error hashing password:', error);
        // Proceed with unhashed password if hashing fails
      }
    }
    
    // Call original method with hashed password
    return originalCreateUser.call(this, userToInsert);
  };
  
  console.log('Enhanced createUser method with password hashing');
  
  return storage;
}

module.exports = { enhanceStorage };
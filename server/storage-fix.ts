/**
 * Storage Fix for Myngenda Authentication
 * 
 * This file enhances the storage module to properly handle user authentication.
 * It adds getUserByEmail method and ensures proper password handling.
 */

import { db } from './db';
import { users, type User, type InsertUser } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// This enhances the existing DatabaseStorage class
export function enhanceStorage(storage: any) {
  // Add getUserByEmail method if it doesn't exist
  if (!storage.getUserByEmail) {
    storage.getUserByEmail = async function(email: string): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    };
    
    console.log('Added getUserByEmail method to storage');
  }
  
  // Store the original createUser method
  const originalCreateUser = storage.createUser;
  
  // Enhance createUser to handle password hashing
  storage.createUser = async function(insertUser: InsertUser): Promise<User> {
    let userToInsert = {...insertUser};
    
    // Only hash password if it's not already hashed
    if (userToInsert.password && !userToInsert.password.startsWith('$2a$') && !userToInsert.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      userToInsert.password = await bcrypt.hash(userToInsert.password, salt);
      console.log('Password hashed for new user');
    }
    
    // Call original method with hashed password
    return originalCreateUser.call(this, userToInsert);
  };
  
  console.log('Enhanced createUser method to handle password hashing');
  
  return storage;
}
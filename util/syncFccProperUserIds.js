/**
 * Server-only utility to sync FCC Proper User IDs for users
 * Call this when students join classrooms or run as a migration script
 */

const { PrismaClient } = require('@prisma/client');
const { getFccProperUserIdByEmail } = require('../fcc_proper');

const prisma = new PrismaClient();

/**
 * Sync FCC Proper User ID for a single user by email
 * @param {string} email - User email
 * @param {Object} context - Next.js context for auth
 * @returns {Promise<boolean>} - true if successful
 */
async function syncUserFccProperUserId(email, context = null) {
  try {
    // Get FCC Proper User ID from FCC API
    const fccProperUserId = await getFccProperUserIdByEmail(email, context);

    if (!fccProperUserId) {
      console.warn(`No FCC Proper User ID found for email: ${email}`);
      return false;
    }

    // Update user in database
    await prisma.user.update({
      where: { email },
      data: { fccProperUserId }
    });

    console.log(
      `✅ Synced FCC Proper User ID for ${email}: ${fccProperUserId}`
    );
    return true;
  } catch (error) {
    console.error(`Error syncing FCC Proper User ID for ${email}:`, error);
    return false;
  }
}

/**
 * Sync FCC Proper User IDs for all users in a classroom
 * @param {string} classroomId - Classroom ID
 * @param {Object} context - Next.js context for auth
 * @returns {Promise<Object>} - { success: number, failed: number }
 */
async function syncClassroomUserIds(classroomId, context = null) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { classroomId },
      select: { fccUserIds: true }
    });

    if (!classroom) {
      throw new Error(`Classroom not found: ${classroomId}`);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: classroom.fccUserIds },
        fccProperUserId: null // Only sync users without FCC Proper IDs
      },
      select: { email: true }
    });

    console.log(
      `🔄 Syncing ${users.length} users for classroom ${classroomId}...`
    );

    let success = 0;
    let failed = 0;

    for (const user of users) {
      const result = await syncUserFccProperUserId(user.email, context);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`✅ Sync complete: ${success} successful, ${failed} failed`);
    return { success, failed };
  } catch (error) {
    console.error('Error syncing classroom user IDs:', error);
    throw error;
  }
}

/**
 * Sync FCC Proper User IDs for ALL users in the database
 * @param {Object} context - Next.js context for auth
 * @returns {Promise<Object>} - { success: number, failed: number }
 */
async function syncAllUserIds(context = null) {
  try {
    const users = await prisma.user.findMany({
      where: {
        fccProperUserId: null,
        email: { not: null }
      },
      select: { email: true }
    });

    console.log(`🔄 Syncing ${users.length} users...`);

    let success = 0;
    let failed = 0;

    for (const user of users) {
      const result = await syncUserFccProperUserId(user.email, context);
      if (result) {
        success++;
      } else {
        failed++;
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Sync complete: ${success} successful, ${failed} failed`);
    return { success, failed };
  } catch (error) {
    console.error('Error syncing all user IDs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  syncUserFccProperUserId,
  syncClassroomUserIds,
  syncAllUserIds
};

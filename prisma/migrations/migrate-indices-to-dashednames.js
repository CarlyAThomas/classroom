/**
 * Migration Script: Convert fccCertifications from indices to dashedNames
 *
 * This script migrates existing classroom records from the old index-based
 * fccCertifications format (e.g., [0, 12, 14]) to the new dashedName format
 * (e.g., ["responsive-web-design", "javascript-algorithms-and-data-structures"]).
 *
 * Run this script once after updating the Prisma schema to String[].
 *
 * Usage: node prisma/migrations/migrate-indices-to-dashednames.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateClassrooms() {
  console.log('🔄 Starting migration: Converting indices to dashedNames...\n');

  try {
    // Fetch the available superblocks from FCC API
    const response = await fetch(
      'https://www.freecodecamp.org/curriculum-data/v1/available-superblocks.json'
    );
    const data = await response.json();
    const superblocks = data.superblocks;

    console.log(`✅ Fetched ${superblocks.length} superblocks from FCC API\n`);

    // Get all classrooms
    const classrooms = await prisma.classroom.findMany();
    console.log(`📊 Found ${classrooms.length} classrooms to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const classroom of classrooms) {
      const { classroomId, classroomName, fccCertifications } = classroom;

      // Check if already migrated (contains strings instead of numbers)
      const isAlreadyMigrated = fccCertifications.some(
        cert => typeof cert === 'string'
      );

      if (isAlreadyMigrated) {
        console.log(`⏭️  Skipping "${classroomName}" (already migrated)`);
        skippedCount++;
        continue;
      }

      // Convert indices to dashedNames
      const dashedNames = [];
      const invalidIndices = [];

      for (const index of fccCertifications) {
        if (
          typeof index === 'number' &&
          index >= 0 &&
          index < superblocks.length
        ) {
          dashedNames.push(superblocks[index].dashedName);
        } else {
          invalidIndices.push(index);
        }
      }

      if (invalidIndices.length > 0) {
        console.warn(
          `⚠️  Warning: "${classroomName}" has invalid indices: ${invalidIndices.join(
            ', '
          )}`
        );
      }

      if (dashedNames.length === 0) {
        console.error(
          `❌ Error: "${classroomName}" has no valid certifications to migrate`
        );
        errorCount++;
        continue;
      }

      try {
        // Update the classroom with dashedNames
        await prisma.classroom.update({
          where: { classroomId },
          data: { fccCertifications: dashedNames }
        });

        console.log(
          `✅ Migrated "${classroomName}": [${fccCertifications.join(
            ', '
          )}] → [${dashedNames.join(', ')}]`
        );
        migratedCount++;
      } catch (error) {
        console.error(
          `❌ Failed to migrate "${classroomName}":`,
          error.message
        );
        errorCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount} classroom(s)`);
    console.log(`⏭️  Already migrated: ${skippedCount} classroom(s)`);
    console.log(`❌ Failed: ${errorCount} classroom(s)`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log(
        '\n⚠️  Some classrooms failed to migrate. Please review the errors above.'
      );
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateClassrooms().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

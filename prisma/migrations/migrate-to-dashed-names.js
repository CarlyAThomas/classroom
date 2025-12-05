/**
 * Data Migration Script: Convert fccCertifications from indices to dashedNames
 *
 * This script migrates existing classroom data from integer-based certification indices
 * to string-based dashedNames for better stability and clarity.
 *
 * Usage: node prisma/migrations/migrate-to-dashed-names.js
 */

import prisma from '../prisma.js';

async function migrateCertifications() {
  console.log('🚀 Starting migration from indices to dashedNames...');

  try {
    // Fetch the available superblocks from FCC API
    console.log('📡 Fetching superblocks from FCC API...');
    const response = await fetch(
      'https://www.freecodecamp.org/curriculum-data/v1/available-superblocks.json'
    );
    const data = await response.json();
    const superblocks = data.superblocks;

    console.log(`✅ Fetched ${superblocks.length} superblocks`);

    // Get all classrooms
    const classrooms = await prisma.classroom.findMany();
    console.log(`📚 Found ${classrooms.length} classrooms to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // Process each classroom
    for (const classroom of classrooms) {
      try {
        const { classroomId, fccCertifications } = classroom;

        // Check if certifications are already dashedNames (strings) or indices (numbers)
        if (fccCertifications.length === 0) {
          console.log(
            `⚠️  Classroom ${classroomId}: No certifications to migrate`
          );
          continue;
        }

        // Check if first element is a number (old format) or string (new format)
        const firstCert = fccCertifications[0];
        if (typeof firstCert === 'string' && !firstCert.match(/^\d+$/)) {
          console.log(`✓ Classroom ${classroomId}: Already using dashedNames`);
          continue;
        }

        // Convert indices to dashedNames
        const dashedNames = [];
        for (const cert of fccCertifications) {
          // Handle both string numbers ("0", "1") and actual numbers (0, 1)
          const index = typeof cert === 'string' ? parseInt(cert, 10) : cert;

          // Skip "Select All" if it somehow got saved
          if (isNaN(index)) {
            console.log(`⚠️  Skipping invalid certification: "${cert}"`);
            continue;
          }

          // Validate index is in range
          if (index < 0 || index >= superblocks.length) {
            console.log(
              `⚠️  Index ${index} out of range (max: ${superblocks.length - 1})`
            );
            continue;
          }

          const dashedName = superblocks[index].dashedName;
          dashedNames.push(dashedName);
        }

        // Update the classroom with dashedNames
        await prisma.classroom.update({
          where: { classroomId },
          data: { fccCertifications: dashedNames }
        });

        console.log(
          `✅ Migrated classroom ${classroomId}: ${fccCertifications.join(
            ', '
          )} → ${dashedNames.join(', ')}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error migrating classroom ${classroom.classroomId}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} classrooms`);
    console.log(`   ❌ Failed: ${errorCount} classrooms`);
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCertifications();

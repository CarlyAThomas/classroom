/**
 * Curriculum Service
 *
 * Handles fetching and caching curriculum data from freeCodeCamp's GraphQL API.
 * Uses server-side caching to minimize API requests and improve performance.
 */

import { GraphQLClient } from 'graphql-request';
import NodeCache from 'node-cache';

// Initialize GraphQL client
const graphqlClient = new GraphQLClient(
  'https://curriculum-db.freecodecamp.org/graphql',
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

// Initialize in-memory cache (TTL: 1 hour)
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour in seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Don't clone objects for better performance
});

/**
 * Fetch curriculum for specific certifications from GraphQL API
 * Results are cached to minimize API requests
 *
 * @param {string[]} certifications - Array of certification dashedNames
 * @returns {Promise<Object>} Challenge lookup map { challengeId: challengeDetails }
 */
export async function getCurriculumForCertifications(certifications) {
  if (!certifications || certifications.length === 0) {
    console.warn(
      '⚠️ No certifications provided to getCurriculumForCertifications'
    );
    return {};
  }

  // Create cache key from sorted certification names
  const cacheKey = `curriculum:${certifications.sort().join(',')}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`❌ Cache MISS: ${cacheKey} - Fetching from GraphQL...`);

  try {
    // Fetch from GraphQL
    const query = `
      query GetCurriculumByCerts($superblocks: [String!]!) {
        superblocks(dashedNames: $superblocks) {
          dashedName
          title
          blocks {
            dashedName
            title
            challenges {
              id
              title
              dashedName
            }
          }
        }
      }
    `;

    const data = await graphqlClient.request(query, {
      superblocks: certifications
    });

    if (!data || !data.superblocks) {
      console.error(
        '❌ GraphQL returned no data for certifications:',
        certifications
      );
      return {};
    }

    // Transform to flat lookup map for fast resolution
    const curriculumMap = buildChallengeMap(data.superblocks);

    console.log(
      `✅ Fetched ${
        Object.keys(curriculumMap).length
      } challenges for certifications: ${certifications.join(', ')}`
    );

    // Cache it
    cache.set(cacheKey, curriculumMap);

    return curriculumMap;
  } catch (error) {
    console.error('❌ Error fetching curriculum from GraphQL:', error);

    // Return empty map on error - calling code can handle missing challenges
    return {};
  }
}

/**
 * Transform nested GraphQL response into flat challenge lookup map
 *
 * @param {Object[]} superblocks - Array of superblock objects from GraphQL
 * @returns {Object} Flat map of { challengeId: challengeDetails }
 */
function buildChallengeMap(superblocks) {
  const map = {};

  for (const superblock of superblocks) {
    for (const block of superblock.blocks) {
      for (const challenge of block.challenges) {
        map[challenge.id] = {
          id: challenge.id,
          title: challenge.title,
          dashedName: challenge.dashedName,
          block: {
            dashedName: block.dashedName,
            title: block.title
          },
          superblock: {
            dashedName: superblock.dashedName,
            title: superblock.title
          }
        };
      }
    }
  }

  return map;
}

/**
 * Resolve student challenge IDs to full challenge details
 *
 * @param {Object[]} studentChallenges - Array of student completion objects with id property
 * @param {Object} curriculumMap - Challenge lookup map from getCurriculumForCertifications
 * @returns {Object[]} Enriched challenges with full details
 */
export function resolveStudentChallenges(studentChallenges, curriculumMap) {
  if (!studentChallenges || !Array.isArray(studentChallenges)) {
    return [];
  }

  return studentChallenges.map(challenge => {
    const details = curriculumMap[challenge.id];

    if (!details) {
      // Challenge not found in curriculum map
      // This can happen if challenge is from a certification not in the classroom
      console.warn(`⚠️ Challenge not found in curriculum map: ${challenge.id}`);
      return {
        ...challenge,
        title: 'Unknown Challenge',
        block: { dashedName: 'unknown', title: 'Unknown Block' },
        superblock: { dashedName: 'unknown', title: 'Unknown Certification' }
      };
    }

    return {
      ...challenge,
      ...details
    };
  });
}

/**
 * Extract all challenge IDs from FCC student data structure
 *
 * @param {Object} studentData - FCC student data with nested certifications/blocks/challenges
 * @returns {string[]} Array of challenge IDs
 */
export function extractChallengeIds(studentData) {
  const challengeIds = [];

  if (!studentData || !studentData.certifications) {
    return challengeIds;
  }

  // Navigate nested structure: certifications -> blocks -> completedChallenges
  for (const certObj of studentData.certifications) {
    // certObj is like { "2022/responsive-web-design": { blocks: [...] } }
    const certKey = Object.keys(certObj)[0];
    const cert = certObj[certKey];

    if (cert && cert.blocks) {
      for (const blockObj of cert.blocks) {
        const blockKey = Object.keys(blockObj)[0];
        const block = blockObj[blockKey];

        if (block && block.completedChallenges) {
          for (const challenge of block.completedChallenges) {
            if (challenge.id) {
              challengeIds.push(challenge.id);
            }
          }
        }
      }
    }
  }

  return challengeIds;
}

/**
 * Clear the curriculum cache (useful for testing or manual cache invalidation)
 */
export function clearCurriculumCache() {
  const keys = cache.keys();
  cache.flushAll();
  console.log(`🗑️ Cleared ${keys.length} items from curriculum cache`);
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    stats: cache.getStats()
  };
}

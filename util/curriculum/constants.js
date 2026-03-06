export const CURRICULUM_GRAPHQL_ENDPOINT =
  'https://curriculum-db.freecodecamp.org/graphql';

/* TODO: Remove these once the graphql database has a filter available for these sections.

  query GetSuperblocksForClassroom {
    superblocks {
      dashedName
      name
      isCertification
      isLegacy            <---- Add this to the database for LEGACY_SUPERBLOCK_DASHED_NAMES
      isJobPrep           <---- Add this to the database for INTERVIEW_PREP_SUPERBLOCK_DASHED_NAMES
    }
  }
  
  */
export const LEGACY_SUPERBLOCK_DASHED_NAMES = new Set([
  'responsive-web-design',
  'javascript-algorithms-and-data-structures',
  'front-end-development-libraries',
  'data-visualization',
  'back-end-development-and-apis',
  'quality-assurance',
  'scientific-computing-with-python',
  'data-analysis-with-python',
  'information-security',
  'machine-learning-with-python',
  'relational-databases',
  'responsive-web-design-22',
  'javascript-algorithms-and-data-structures-22',
  'college-algebra-with-python',
  'full-stack-developer'
]);

export const INTERVIEW_PREP_SUPERBLOCK_DASHED_NAMES = new Set([
  'the-odin-project',
  'coding-interview-prep',
  'project-euler',
  'rosetta-code'
]);

// Used for *dashboard rendering only* — defines what blocks to fetch and merge.
// back-end-development-and-apis-v9 includes v8 as an embedded chapter.
export const TIERED_SUPERBLOCK_REQUIREMENTS = {
  'full-stack-developer-v9': [
    'responsive-web-design-v9',
    'javascript-v9',
    'front-end-development-libraries-v9',
    'python-v9',
    'relational-databases-v9',
    'back-end-development-and-apis-v9',
    'full-stack-developer-v9'
  ],
  'back-end-development-and-apis-v9': [
    'back-end-development-and-apis',
    'back-end-development-and-apis-v9'
  ]
};

// Used for *Prisma storage only* — defines what separate superblock dashedNames
// to save when a teacher selects a tiered cert. Only certs whose components are
// truly separate superblocks (not embedded chapters) belong here.
export const PRISMA_SUPERBLOCK_EXPANSION = {
  'full-stack-developer-v9': [
    'responsive-web-design-v9',
    'javascript-v9',
    'front-end-development-libraries-v9',
    'python-v9',
    'relational-databases-v9',
    'back-end-development-and-apis-v9',
    'full-stack-developer-v9'
  ]
};

/**
 * Returns the dashedNames to store in Prisma for a given teacher-selected superblock.
 * For non-tiered superblocks, returns just the superblock itself.
 */
export function getStoredSuperblocks(dashedName) {
  return PRISMA_SUPERBLOCK_EXPANSION[dashedName] ?? [dashedName];
}

/**
 * Returns all superblock dashedNames needed to fetch blocks for the dashboard.
 * For non-tiered superblocks, returns just the superblock itself.
 */
export function getRequiredSuperblocks(dashedName) {
  return TIERED_SUPERBLOCK_REQUIREMENTS[dashedName] ?? [dashedName];
}

/**
 * Returns true if a superblock has tiered (multi-superblock) requirements.
 */
export function isTieredSuperblock(dashedName) {
  return dashedName in TIERED_SUPERBLOCK_REQUIREMENTS;
}

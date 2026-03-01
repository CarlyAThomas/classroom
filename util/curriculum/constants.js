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

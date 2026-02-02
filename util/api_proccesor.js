export const FCC_BASE_URL = 'https://www.freecodecamp.org/curriculum-data/v2';
export const AVAILABLE_SUPER_BLOCKS =
  FCC_BASE_URL + '/available-superblocks.json';

const TIERED_SUPERBLOCK_REQUIREMENTS = {
  'full-stack-developer-v9': [
    'responsive-web-design-v9',
    'javascript-v9',
    'front-end-development-libraries-v9',
    'python-v9',
    'relational-databases-v9',
    'back-end-development-and-apis',
    'back-end-development-and-apis-v9',
    'full-stack-developer-v9'
  ],
  'back-end-development-and-apis-v9': [
    'back-end-development-and-apis',
    'back-end-development-and-apis-v9'
  ]
};

const SUPERBLOCK_DISPLAY_ALIASES = {
  'back-end-development-and-apis': 'back-end-development-and-apis-v9'
};

const SUPERBLOCK_DISPLAY_ORDER = [
  'responsive-web-design-v9',
  'javascript-v9',
  'front-end-development-libraries-v9',
  'python-v9',
  'relational-databases-v9',
  'back-end-development-and-apis-v9',
  'full-stack-developer-v9',
  'a2-english-for-developers',
  'b1-english-for-developers',
  'a1-professional-spanish',
  'a1-professional-chinese',
  'the-odin-project',
  'coding-interview-prep',
  'project-euler',
  'rosetta-code',
  'foundational-c-sharp-with-microsoft'
];

function expandTieredSuperblocks(dashedNames = []) {
  const expanded = new Set();

  dashedNames.forEach(name => {
    const requirements = TIERED_SUPERBLOCK_REQUIREMENTS[name];
    if (requirements) {
      requirements.forEach(req => expanded.add(req));
    } else {
      expanded.add(name);
    }
  });

  return Array.from(expanded);
}

function normalizeSuperblockDashedName(dashedName) {
  return SUPERBLOCK_DISPLAY_ALIASES[dashedName] || dashedName;
}

function sortSuperblocksByDisplayOrder(dashedNames = []) {
  const orderMap = new Map(
    SUPERBLOCK_DISPLAY_ORDER.map((name, index) => [name, index])
  );
  return [...dashedNames].sort((a, b) => {
    const aIndex = orderMap.has(a) ? orderMap.get(a) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.has(b) ? orderMap.get(b) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b);
  });
}

export function orderCertificationOptions(options = []) {
  const orderMap = new Map(
    SUPERBLOCK_DISPLAY_ORDER.map((name, index) => [name, index])
  );
  return [...options].sort((a, b) => {
    const aIndex = orderMap.has(a.value)
      ? orderMap.get(a.value)
      : Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.has(b.value)
      ? orderMap.get(b.value)
      : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.displayName.localeCompare(b.displayName);
  });
}

/** ============ getAllTitlesAndDashedNamesSuperblockJSONArray() ============ */
export async function getAllTitlesAndDashedNamesSuperblockJSONArray() {
  // calls this API https://www.freecodecamp.org/curriculum-data/v2/available-superblocks.json
  const superblocksres = await fetch(AVAILABLE_SUPER_BLOCKS);

  // v2 response structure is { superblocks: { core: [], legacy: [], english: [], extra: [], professional: [] } }
  // v1 response structure is { superblocks: [ {}, {}, ...etc] }
  const curriculumData = await superblocksres.json();

  if (Array.isArray(curriculumData.superblocks)) {
    return curriculumData.superblocks;
  }

  const categoriesOrder = [
    'core',
    'legacy',
    'english',
    'extra',
    'professional'
  ];

  const orderedCategories = categoriesOrder
    .filter(key => Array.isArray(curriculumData.superblocks?.[key]))
    .map(key => curriculumData.superblocks[key]);

  const remainingCategories = Object.keys(curriculumData.superblocks || {})
    .filter(key => !categoriesOrder.includes(key))
    .map(key => curriculumData.superblocks[key])
    .filter(Array.isArray);

  return [...orderedCategories, ...remainingCategories].flat();
}

/** ============ getAllSuperblockTitlesAndDashedNames() ============ */
export async function getAllSuperblockTitlesAndDashedNames() {
  let superblockTitleAndDashedNameJSONArray =
    await getAllTitlesAndDashedNamesSuperblockJSONArray();

  let superblockDashedNameToTitleArrayMapping = [];
  superblockTitleAndDashedNameJSONArray.forEach(
    superblockDashedNameAndTitleObject => {
      let superblockDashedNameToTitleArray = {
        superblockDashedName: '',
        superblockReadableTitle: ''
      };
      let superblockDashedName = superblockDashedNameAndTitleObject.dashedName;
      let superblockTitle = superblockDashedNameAndTitleObject.title;
      superblockDashedNameToTitleArray.superblockDashedName =
        superblockDashedName;
      superblockDashedNameToTitleArray.superblockReadableTitle =
        superblockTitle;
      superblockDashedNameToTitleArrayMapping.push(
        superblockDashedNameToTitleArray
      );
    }
  );
  return superblockDashedNameToTitleArrayMapping;
}

/** ============ getSuperblockTitlesInClassroomByIndex(fccCertificationsDashedNames) ============ */
// Now accepts dashed names stored in fccCertifications and looks up titles by property.
export async function getSuperblockTitlesInClassroomByIndex(
  fccCertificationsDashedNames
) {
  let allSuperblockTitles = await getAllSuperblockTitlesAndDashedNames();
  const expandedDashedNames = expandTieredSuperblocks(
    fccCertificationsDashedNames
  );
  const normalizedDashedNames = expandedDashedNames
    .map(normalizeSuperblockDashedName)
    .filter((name, index, arr) => arr.indexOf(name) === index);
  const orderedDashedNames = sortSuperblocksByDisplayOrder(
    normalizedDashedNames
  );

  console.log(
    '[getSuperblockTitlesInClassroomByIndex] Input:',
    fccCertificationsDashedNames
  );
  console.log(
    '[getSuperblockTitlesInClassroomByIndex] Expanded:',
    expandedDashedNames
  );

  return orderedDashedNames.map(dashedName => {
    const superblock = allSuperblockTitles.find(
      sb => sb.superblockDashedName === dashedName
    );
    return superblock ? superblock.superblockReadableTitle : dashedName;
  });
}

/** ============ checkIfStudentHasProgressDataForSuperblock(studentJSON, superblockDashboardObj) ============ */
// Since we are using hard-coded mock data at the moment, this check allows to anticipate the
// correct response, however, when the student API data goes live, it will be assumed that it will on
// provide student data on the specified superblocks selected by the teacher
export function checkIfStudentHasProgressDataForSuperblocksSelectedByTeacher(
  studentJSON,
  superblockDashboardObj
) {
  // Returns a boolean matrix which checks to see enrollment in at least 1 superblock (at least 1 because in the GlobalDashboard component we calculate the cumulative progress)

  let superblockTitlesSelectedByTeacher = [];

  superblockDashboardObj.forEach(blockEntry => {
    const blockObj = Array.isArray(blockEntry) ? blockEntry[0] : blockEntry;
    if (
      blockObj?.superblock &&
      !superblockTitlesSelectedByTeacher.includes(blockObj.superblock)
    ) {
      superblockTitlesSelectedByTeacher.push(blockObj.superblock);
    }
  });

  let studentResponseDataHasSuperblockBooleanArray = [];
  studentJSON.forEach(studentDetails => {
    let individualStudentEnrollmentStatus = [];
    studentDetails.certifications.forEach(certObj => {
      let studentIsEnrolledSuperblock = false;
      if (superblockTitlesSelectedByTeacher.includes(Object.keys(certObj)[0])) {
        studentIsEnrolledSuperblock = true;
      }
      individualStudentEnrollmentStatus.push(studentIsEnrolledSuperblock);
    });
    studentResponseDataHasSuperblockBooleanArray.push(
      individualStudentEnrollmentStatus
    );
  });

  return studentResponseDataHasSuperblockBooleanArray;
}

/** ============ sortSuperBlocks(superblock) ============ */
/**
 * This function returns a 2D array for each block within blocks
 * block[0] is the name of the course
 * block[1] is a dictionary {desc, challenges}
 * Example Usage:
 * sortSuperBlocks("2022/responsive-web-design.json", "https://www.freecodecamp.org/curriculum-data/v2/2022/responsive-web-design.json")
 *
 */
export function sortSuperBlocks(superblock) {
  let sortedBlock = superblock.sort((a, b) => a['order'] - b['order']);
  return sortedBlock;
}

/** ============ getDashedNamesURLs(fccCertifications) ============ */
/*
 * [Parameters] an array of indices as a parameter.
 * Those indices correspond to an index in the flattened superblocks list returned by
 * https://www.freecodecamp.org/curriculum-data/v2/available-superblocks.json
 * The array of indices is stored in Prisma as fccCertificates (see const certificationNumbers in [id].js).
 *
 * [Returns] an array of URL endpoints where JSON for superblocks is accessed.
 *
 * Example usage:
 * getDashedNamesURLs([0, 2, 3])
 *
 *
 * Example output:
 * [
 * 'https://www.freecodecamp.org/curriculum-data/v2/2022/responsive-web-design.json',
 * 'https://www.freecodecamp.org/curriculum-data/v2/responsive-web-design.json',
 * 'https://www.freecodecamp.org/curriculum-data/v2/back-end-development-and-apis.json'
 * ]
 *
 * */
export async function getDashedNamesURLs(fccCertifications) {
  console.log('[getDashedNamesURLs] Input:', fccCertifications);
  if (!fccCertifications || fccCertifications.length === 0) {
    return [];
  }

  const expandedDashedNames = expandTieredSuperblocks(fccCertifications);

  console.log('[getDashedNamesURLs] Expanded:', expandedDashedNames);

  const urls = expandedDashedNames.map(
    dashedName => `${FCC_BASE_URL}/${dashedName}.json`
  );

  console.log('[getDashedNamesURLs] Output URLs:', urls);
  return urls;
}

/** ============ getNonDashedNamesURLs([0,1,2) ============ */
/**
 * The parameter relates to the index found at the following API response
 * https://www.freecodecamp.org/curriculum-data/v2/available-superblocks.json
 *
 * Context: The way we know which superblocks are assigned in the classroom
 * is by storing the indicies in our DB (Prisma to access/write)
 * [see the Classroom table, then the fccCertifications column]
 * if you would like more context see the following file(s):
 * pages/classes/index.js and take a look at the Modal component
 * (components/modal.js), and also take a look at the
 * ClassInviteTable component (component/ClassInviteTable).
 * You can also search the codebase for the folling string to get more context
 * on the relation on the indicies stored in Prisma (unded the
 * fccCertifications column): "Select certifications:"
 */
export async function getNonDashedNamesURLs(fccCertificationsDashedNames) {
  if (
    !fccCertificationsDashedNames ||
    fccCertificationsDashedNames.length === 0
  ) {
    return [];
  }

  const superblocks = await getAllTitlesAndDashedNamesSuperblockJSONArray();

  return fccCertificationsDashedNames.map(dashedName => {
    const superblock = superblocks.find(sb => sb.dashedName === dashedName);
    return superblock ? superblock.title : dashedName;
  });
}

/** ============ getSuperBlockJsons(superblockURLS) ============ */
/*
 * [Parameters] an array of URLs as a parameter, where the URLs are the json endpoint URLs that contain information about the superblock/certificate.
 *
 * [Returns] an array of objects containing superblock/certificate information.
 * The objects have 1 key: the superblock/certificate URL (dashed/or undashed URL name) and the value of the objects
 * is the corresponding information associated with the superblock/certificate. The values contain two arrays 'intro' and 'blocks'.
 *
 * Example usage:
 * getSuperBlockJsons([
 * 'https://www.freecodecamp.org/curriculum-data/v2/2022/responsive-web-design.json',
 * 'https://www.freecodecamp.org/curriculum-data/v2/javascript-algorithms-and-data-structures.json'
 * ])
 *
 *
 * Example output:
 * [
 * {
 * '2022/responsive-web-design': { intro: [Array], blocks: [Object] }
 * },
 * {
 * 'javascript-algorithms-and-data-structures': { intro: [Array], blocks: [Object] }
 * }
 * ]
 *
 * */
export async function getSuperBlockJsons(superblockURLS) {
  console.log('[getSuperBlockJsons] Fetching', superblockURLS.length, 'URLs');
  let responses = await Promise.all(
    superblockURLS.map(async currUrl => {
      let currResponse = await fetch(currUrl);
      let superblockJSON = currResponse.json();
      return superblockJSON;
    })
  );
  console.log(
    '[getSuperBlockJsons] Got',
    responses.length,
    'JSONs. Keys:',
    responses.map(r => Object.keys(r)[0])
  );
  return responses;
}

/** ============ createSuperblockDashboardObject(superblock) ============ */
/*
 * [Parameters] an array of objects containing superblock/certificate information as a parameter.
 *
 * [Returns] a 2d array of objects, where the array length is 1, and array[0] is length N, where array[0][N] are objects
 * with block (not superblock) data.
 *
 * Example usage:
 * createDasboardObject([
 * {
 * '2022/responsive-web-design': { intro: [Array], blocks: [Object] }
 * },
 * {
 * 'javascript-algorithms-and-data-structures': { intro: [Array], blocks: [Object] }
 * }
 *])
 *
 *
 *
 * Example output:
 * [
 * [
 * {
 * name: 'Learn HTML by Building a Cat Photo App',
 * selector: 'learn-html-by-building-a-cat-photo-app',
 * dashedName: 'learn-html-by-building-a-cat-photo-app',
 * allChallenges: [Array],
 * order: 0
 * },
 * {
 * name: 'Learn Basic CSS by Building a Cafe Menu',
 * selector: 'learn-basic-css-by-building-a-cafe-menu',
 * dashedName: 'learn-basic-css-by-building-a-cafe-menu',
 * allChallenges: [Array],
 * order: 1
 * }
 * ]
 * ]
 *
 */
export async function createSuperblockDashboardObject(superblock) {
  let superblockDashedNamesAndTitlesArray =
    await getAllSuperblockTitlesAndDashedNames();

  console.log(
    '[createSuperblockDashboardObject] Input superblocks:',
    superblock.length
  );

  let sortedBlocks = superblock.map(currBlock => {
    let certification = sortSuperblocksByDisplayOrder(
      Object.keys(currBlock)
    ).map(certificationName => {
      let superblockDashedNameAndTitle =
        superblockDashedNamesAndTitlesArray.find(
          superblockDashedNameAndTitleJSON =>
            superblockDashedNameAndTitleJSON['superblockDashedName'] ===
            certificationName
        );
      const displaySuperblockDashedName = normalizeSuperblockDashedName(
        superblockDashedNameAndTitle?.superblockDashedName || certificationName
      );
      const displaySuperblockTitle =
        superblockDashedNamesAndTitlesArray.find(
          superblockDashedNameAndTitleJSON =>
            superblockDashedNameAndTitleJSON['superblockDashedName'] ===
            displaySuperblockDashedName
        )?.superblockReadableTitle || displaySuperblockDashedName;

      const curriculum = currBlock[certificationName] || {};
      const legacyBlocks = curriculum.blocks;
      const chapters = curriculum.chapters || [];
      const v9BlocksFromModules = chapters.flatMap(chapter =>
        (chapter.modules || []).flatMap(module => module.blocks || [])
      );
      const v9ExamFallbackBlocks = chapters
        .filter(
          chapter =>
            chapter?.chapterType === 'exam' &&
            (!chapter.modules || chapter.modules.length === 0)
        )
        .map((chapter, index) => ({
          meta: {
            dashedName: chapter.dashedName,
            name: chapter.name,
            order: 10000 + index,
            challengeOrder: []
          },
          challenges: {
            name: chapter.name,
            order: 10000 + index,
            challengeOrder: []
          }
        }));
      const v9Blocks = [...v9BlocksFromModules, ...v9ExamFallbackBlocks];
      const blocksSource = Array.isArray(legacyBlocks)
        ? legacyBlocks
        : v9Blocks.length
        ? v9Blocks
        : legacyBlocks || {};
      const isBlocksArray = Array.isArray(blocksSource);
      const normalizedBlocks = isBlocksArray
        ? blocksSource
        : blocksSource || {};

      let blockInfo = (
        isBlocksArray ? normalizedBlocks : Object.entries(normalizedBlocks)
      ).map((blockEntry, index) => {
        /*
The following object is necessary in order to sort our courses/superblocks correctly in order to pass them into our dashtabs.js component


Layout:
blockInfo: This is an array of objects that will be passed into our sorting function.


name: This is the human readable name of the course
selector: this is for our dashtabs component to have a unique selector for each dynamically generated tab
allChallenges: As the name implies, this holds all of our challenges (inside of the current block) in correct order
The last bit is the order of the current block inside of the certification, not the challenges that exist inside of this block
*/
        const course = isBlocksArray
          ? blockEntry?.meta?.dashedName || blockEntry?.dashedName
          : blockEntry[0];
        const blockData = isBlocksArray ? blockEntry : blockEntry[1];
        const blockMeta = blockData?.meta || {};
        const challenges = blockData?.challenges || blockData;

        let currCourseBlock = {
          superblock: displaySuperblockDashedName,
          superblockReadableTitle: displaySuperblockTitle,
          blockName: isBlocksArray ? blockMeta?.name : challenges?.name,
          /*
This selector is changed inside of components/dashtabs.js
If you are having issues with the selector, you should probably check there.
*/
          selector: course,
          dashedName: course,
          allChallenges: isBlocksArray
            ? (blockMeta?.challengeOrder || [])
                .map(challenge =>
                  typeof challenge === 'string' ? challenge : challenge?.id
                )
                .filter(Boolean)
            : challenges?.challengeOrder,
          order: isBlocksArray ? blockMeta?.order ?? index : challenges?.order
        };
        return currCourseBlock;
      });
      sortSuperBlocks(blockInfo);
      return blockInfo;
    });
    return certification;
  });
  // Since we return new arrays at every map, we have to flatten our 3D array down to 2D.
  const flattened = sortedBlocks.flat(2);
  console.log(
    '[createSuperblockDashboardObject] Returning',
    flattened.length,
    'blocks'
  );
  if (flattened.length > 0) {
    console.log(
      '  Sample blocks:',
      flattened
        .slice(0, 2)
        .map(
          b =>
            `${b.superblock}>${b.dashedName}(${b.allChallenges.length} challenges)`
        )
    );
  }
  return flattened;
}

/** ============ fetchStudentData() ============ */
export async function fetchStudentData() {
  let data = await fetch(process.env.MOCK_USER_DATA_URL);
  return data.json();
}

/** ============ getIndividualStudentData(studentEmail) ============ */
// Uses for the details page
export async function getIndividualStudentData(studentEmail) {
  let studentData = await fetchStudentData();
  let individualStudentObj = {};
  studentData.forEach(individualStudentDetailsObj => {
    if (individualStudentDetailsObj.email === studentEmail) {
      individualStudentObj = individualStudentDetailsObj;
    }
  });

  return individualStudentObj;
}

/** ============ getTotalChallengesForSuperblocks(superblockDasboardObj) ============ */
export function getTotalChallengesForSuperblocks(superblockDasboardObj) {
  console.log(
    '[getTotalChallengesForSuperblocks] Input:',
    superblockDasboardObj.length,
    'entries'
  );
  let totalChallengesInSuperblock = 0;
  superblockDasboardObj.forEach(blockEntry => {
    if (Array.isArray(blockEntry)) {
      blockEntry.forEach(blockObj => {
        totalChallengesInSuperblock += blockObj?.allChallenges?.length || 0;
      });
      return;
    }
    totalChallengesInSuperblock += blockEntry?.allChallenges?.length || 0;
  });

  console.log(
    '[getTotalChallengesForSuperblocks] Total:',
    totalChallengesInSuperblock
  );
  return totalChallengesInSuperblock;
}

/** ============ extractStudentCompletionTimestamps(studentSuperblockProgressJSONArray) ============ */
export function extractStudentCompletionTimestamps(
  studentSuperblockProgressJSONArray
) {
  let completedTimestampsArray = [];

  studentSuperblockProgressJSONArray.forEach(superblockProgressJSON => {
    // since the keys are dynamic we have to use Object.values(obj)
    let superblockProgressJSONArray = Object.values(superblockProgressJSON)[0]
      .blocks;
    superblockProgressJSONArray.forEach(blockProgressJSON => {
      let blockKey = Object.keys(blockProgressJSON)[0];
      let allCompletedChallengesArrayWithTimestamps =
        blockProgressJSON[blockKey].completedChallenges;
      allCompletedChallengesArrayWithTimestamps.forEach(completionDetails => {
        completedTimestampsArray.push(completionDetails.completedDate);
      });
    });
  });
  return completedTimestampsArray;
}

/** ============ extractFilteredCompletionTimestamps(studentSuperblockProgressJSONArray, selectedSuperblocks) ============ */
export function extractFilteredCompletionTimestamps(
  studentSuperblockProgressJSONArray,
  selectedSuperblocks
) {
  let completedTimestampsArray = [];

  studentSuperblockProgressJSONArray.forEach(superblockProgressJSON => {
    let superblockDashedName = Object.keys(superblockProgressJSON)[0];

    // Only include selected superblocks
    if (!selectedSuperblocks.includes(superblockDashedName)) {
      return;
    }

    let superblockProgressJSONArray = Object.values(superblockProgressJSON)[0]
      .blocks;
    superblockProgressJSONArray.forEach(blockProgressJSON => {
      let blockKey = Object.keys(blockProgressJSON)[0];
      let allCompletedChallengesArrayWithTimestamps =
        blockProgressJSON[blockKey].completedChallenges;

      allCompletedChallengesArrayWithTimestamps.forEach(completionDetails => {
        completedTimestampsArray.push(completionDetails.completedDate);
      });
    });
  });

  return completedTimestampsArray;
}

/** ============ getStudentProgressInSuperblock(studentSuperblocksJSON, specificSuperblockDashedName) ============ */
export function getStudentProgressInSuperblock(
  studentSuperblocksJSON,
  specificSuperblockDashedName
) {
  let blockProgressDetails = [];

  studentSuperblocksJSON.certifications.forEach(superblockProgressJSON => {
    // the keys are dynamic which is why we have to use Object.keys(obj)
    let superblockDashedName = Object.keys(superblockProgressJSON)[0];
    if (specificSuperblockDashedName === superblockDashedName) {
      blockProgressDetails = Object.values(superblockProgressJSON)[0].blocks;
    }
  });

  return blockProgressDetails;
}

/** ============ getStudentTotalChallengesCompletedInBlock(studentProgressInBlock,blockName) ============ */
export function getStudentTotalChallengesCompletedInBlock(
  studentProgressInBlock,
  blockName
) {
  let totalChallengesCompletedInBlock = 0;
  studentProgressInBlock.forEach(blockProgressObj => {
    let blockTitle = Object.keys(blockProgressObj)[0];

    if (blockTitle === blockName) {
      totalChallengesCompletedInBlock =
        blockProgressObj[blockTitle].completedChallenges.length;
    }
  });

  return totalChallengesCompletedInBlock;
}

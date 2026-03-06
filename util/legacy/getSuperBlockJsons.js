import { fetchAllSuperblocksWithBlocksFromGraphQL } from '../curriculum/fetchSuperblocksFromGraphQL';

/**
 * [Parameters] an array of superblock dashed names.
 *
 * [Returns] an array of objects containing superblock/certificate information.
 * The objects have 1 key: the superblock/certificate URL (dashed/or undashed URL name) and the value of the objects
 * is the corresponding information associated with the superblock/certificate. The values contain two arrays 'intro' and 'blocks'.
 *
 * Example usage:
 * getSuperBlockJsons([
 * 'https://www.freecodecamp.org/curriculum-data/v1/2022/responsive-web-design.json',
 * 'https://www.freecodecamp.org/curriculum-data/v1/javascript-algorithms-and-data-structures.json'
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
 * This function now adapts GraphQL superblock data to the legacy structure expected
 * by createSuperblockDashboardObject.
 * */
export async function getSuperBlockJsons(superblockURLS) {
  if (!Array.isArray(superblockURLS) || superblockURLS.length === 0) {
    return [];
  }

  // Use the unfiltered fetch so legacy dashedNames stored in Prisma
  // (e.g. back-end-development-and-apis) can be resolved.
  const allSuperblocks = await fetchAllSuperblocksWithBlocksFromGraphQL();
  const selectedDashedNames = new Set(superblockURLS);

  return allSuperblocks
    .filter(superblock => selectedDashedNames.has(superblock.dashedName))
    .map(superblock => {
      const blocks = (superblock.blockObjects || []).reduce(
        (accumulator, block, index) => {
          accumulator[block.dashedName] = {
            challenges: {
              name: block.name,
              order: typeof block.order === 'number' ? block.order : index,
              challengeOrder: (block.challengeOrder || [])
                .map(challenge => challenge.id)
                .filter(Boolean)
            }
          };
          return accumulator;
        },
        {}
      );

      return { [superblock.dashedName]: { blocks } };
    });
}

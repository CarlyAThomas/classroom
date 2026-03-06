import { fetchAllSuperblocksWithBlocksFromGraphQL } from '../curriculum/fetchSuperblocksFromGraphQL';
import { getRequiredSuperblocks } from '../curriculum/constants';

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

  const allSuperblocks = await fetchAllSuperblocksWithBlocksFromGraphQL();
  const superblocksByDashedName = new Map(
    allSuperblocks.map(s => [s.dashedName, s])
  );

  const toBlocks = superblock =>
    (superblock.blockObjects || []).reduce((accumulator, block, index) => {
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
    }, {});

  // Filter out any dashedName that is already a sub-requirement of another
  // selected tiered cert (e.g. if both 'back-end-development-and-apis' and
  // 'back-end-development-and-apis-v9' are stored, only process the v9 one)
  const absorbedNames = new Set(
    superblockURLS.flatMap(name => {
      const required = getRequiredSuperblocks(name);
      // Exclude the top-level name itself — only collect its sub-requirements
      return required.filter(r => r !== name);
    })
  );
  const topLevelNames = superblockURLS.filter(name => !absorbedNames.has(name));

  return topLevelNames.map(dashedName => {
    const required = getRequiredSuperblocks(dashedName);

    // Merge blocks from all required superblocks into a single entry under the selected name
    const mergedBlocks = required.reduce((acc, reqName) => {
      const superblock = superblocksByDashedName.get(reqName);
      if (superblock) {
        Object.assign(acc, toBlocks(superblock));
      }
      return acc;
    }, {});

    return { [dashedName]: { blocks: mergedBlocks } };
  });
}

import { getAllTitlesAndDashedNamesSuperblockJSONArray } from '../curriculum/getAllTitlesAndDashedNamesSuperblockJSONArray';

/**
 * [Parameters] an array of superblock dashed names.
 * Backward-compatible: numeric indices and numeric strings are resolved to dashed names.
 *
 * [Returns] an array of superblock dashed names.
 *
 * Example usage:
 * getDashedNamesURLs(['responsive-web-design-v9', 'javascript-v9'])
 *
 *
 * Example output:
 * ['responsive-web-design-v9', 'javascript-v9']
 *
 * NOTE: This function is deprecated for v9 curriculum which doesn't have individual REST API JSON files.
 * */
export async function getDashedNamesURLs(fccCertifications) {
  if (!Array.isArray(fccCertifications) || fccCertifications.length === 0) {
    return [];
  }

  const superblocks = await getAllTitlesAndDashedNamesSuperblockJSONArray();

  return fccCertifications
    .map(certification => {
      if (typeof certification === 'number') {
        return superblocks[certification]?.dashedName;
      }

      const maybeIndex = Number(certification);
      if (!Number.isNaN(maybeIndex) && String(maybeIndex) === certification) {
        return superblocks[maybeIndex]?.dashedName;
      }

      return certification;
    })
    .filter(Boolean);
}

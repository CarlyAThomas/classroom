import { getAllTitlesAndDashedNamesSuperblockJSONArray } from '../curriculum/getAllTitlesAndDashedNamesSuperblockJSONArray';

/**
 * The parameter relates to selected superblock dashed names.
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
export async function getNonDashedNamesURLs(fccCertificationsIndex) {
  if (
    !Array.isArray(fccCertificationsIndex) ||
    fccCertificationsIndex.length === 0
  ) {
    return [];
  }

  const superblocks = await getAllTitlesAndDashedNamesSuperblockJSONArray();

  return fccCertificationsIndex.map(certification => {
    if (typeof certification === 'number') {
      return superblocks[certification]?.title || String(certification);
    }

    const maybeIndex = Number(certification);
    if (!Number.isNaN(maybeIndex) && String(maybeIndex) === certification) {
      return superblocks[maybeIndex]?.title || certification;
    }

    const match = superblocks.find(
      superblock => superblock.dashedName === certification
    );
    return match?.title || certification;
  });
}

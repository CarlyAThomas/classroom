import React from 'react';
import styles from './DetailsCSS.module.css';
import DetailsDashboardList from './DetailsDashboardList';
import {
  getStudentProgressInSuperblock,
  extractFilteredCompletionTimestamps,
  orderCertificationOptions
} from '../util/api_proccesor';
import StudentActivityChart from './StudentActivityChart';

export default function DetailsDashboard(props) {
  const superblockProgress = superblockDashedName => {
    let studentProgress = props.studentData;

    return getStudentProgressInSuperblock(
      studentProgress,
      superblockDashedName
    );
  };

  const selectedSuperblocks = orderCertificationOptions(
    [
      ...new Set(
        props.superblocksDetailsJSONArray
          .map(blockObj => blockObj?.superblock)
          .filter(Boolean)
      )
    ].map(dashedName => ({
      value: dashedName,
      displayName: dashedName
    }))
  ).map(option => option.value);
  const filteredCompletionTimestamps = extractFilteredCompletionTimestamps(
    props.studentData.certifications,
    selectedSuperblocks
  );

  return (
    <>
      <StudentActivityChart timestamps={filteredCompletionTimestamps} />
      {selectedSuperblocks.map((superblockDashedName, idx) => {
        const blocksForSuperblock = props.superblocksDetailsJSONArray.filter(
          blockObj => blockObj.superblock === superblockDashedName
        );
        let progressInBlocks = superblockProgress(superblockDashedName);
        let superblockTitle = props.superblockTitles[idx];
        return (
          <div key={idx} className={styles.board_container}>
            <DetailsDashboardList
              superblockTitle={superblockTitle}
              blockData={blocksForSuperblock}
              studentProgressInBlocks={progressInBlocks}
            ></DetailsDashboardList>
          </div>
        );
      })}
    </>
  );
}

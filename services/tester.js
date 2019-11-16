const gitPromise = require('simple-git/promise');
const compareService = require('./comparer');
const path = require('path');

async function compareVersions(newerDirectory, repoURL) {
  const olderDirectory = newerDirectory.replace('newer', 'older');
  const { all } = await gitPromise(newerDirectory).tags();
  const tags = all.map(cleanVersion).filter(item => item !== null);

  let result = {};
  const defaultMetadata = {
    BC: 0,
    NBC: 0,
    ADD_METHOD: 0,
    REMOVE_METHOD: 0,
    ADD_PARAM: 0,
    ADD_PARAM_DEFAULT: 0,
    REMOVE_PARAM: 0,
    ADD_CLASS: 0,
    REMOVE_CLASS: 0,
  }
  let metadata = {
    TOTAL: defaultMetadata,
    MINOR: defaultMetadata,
    MAJOR: defaultMetadata,
    PATCH: defaultMetadata
  }

  for(let i = 0; i < tags.length - 1; i++) {
    const versionA = tags[i];
    const versionB = tags[i + 1];
    const data = await compareService.compareVersions(newerDirectory, olderDirectory, versionB.original, versionA.original);
    const type = comparer(versionB.formatted, versionA.formatted);

    result[`${versionB.original}/${versionA.original}`] = {
      data,
      type
    }

    metadata = {
      TOTAL: calculateMetadata(metadata.TOTAL, data),
      PATCH: calculateChangesByType(metadata.PATCH, type === 'PATCH' && data),
      MINOR: calculateChangesByType(metadata.MINOR, type === 'MINOR' && data),
      MAJOR: calculateChangesByType(metadata.MAJOR, type === 'MAJOR' && data)
    }
  }
  
  const repoName = `${repoURL.split('/')[3]}/${repoURL.split('/')[4]}`;
  return { [repoName]: { result, metadata } };
}

function calculateChangesByType(metadata, data) {
  if(data) {
    return calculateMetadata(metadata, data);
  }
 
  return metadata;
}

function calculateMetadata(metadata, data) {
  return {
    BC: metadata.BC + data.metadata.BC,
    NBC: metadata.NBC + data.metadata.NBC,
    ADD_METHOD: metadata.ADD_METHOD + data.metadata.ADD_METHOD,
    REMOVE_METHOD: metadata.REMOVE_METHOD + data.metadata.REMOVE_METHOD,
    ADD_PARAM: metadata.ADD_PARAM + data.metadata.ADD_PARAM,
    ADD_PARAM_DEFAULT: metadata.ADD_PARAM_DEFAULT + data.metadata.ADD_PARAM_DEFAULT,
    REMOVE_PARAM: metadata.REMOVE_PARAM + data.metadata.REMOVE_PARAM,
    ADD_CLASS: metadata.ADD_CLASS + data.metadata.ADD_CLASS,
    REMOVE_CLASS: metadata.REMOVE_CLASS + data.metadata.REMOVE_CLASS
  }
}

function comparer(newer, older) {
  const splitNewer = newer.split('.').map(c => parseInt(c, 10));
  const splitOlder = older.split('.').map(c => parseInt(c, 10));

  if(splitNewer[0] > splitOlder[0]) {
    return 'MAJOR';
  } else if (splitNewer[1] > splitOlder[1]) {
    return 'MINOR';
  }

  return 'PATCH'
}

function cleanVersion(version) {
  if(version.includes('-')) {
    return null;
  }

  return { formatted: version.replace(/[^\d.]/g, ''), original: version };
}

module.exports = {
  compareVersions: function(newerDirectory, repoURL) {
    return compareVersions(newerDirectory, repoURL)
  }
};
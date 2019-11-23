const gitHandler = require('./gitHandler');
const builder = require('./builder');
const walk = require('walk');
const walk2 = require('walk');
const fs = require('fs');

function mergeResults(newResult, oldResult, path) {
  if(!path) return oldResult;
  if(!oldResult) return newResult;
  if(!newResult) return oldResult;
  return {
    BC: [...oldResult.BC, ...newResult.BC.map(item => ({ ...item, path }))],
    NBC: [...oldResult.NBC, ...newResult.NBC.map(item => ({ ...item, path }))],
    metadata: {
      BC: newResult.metadata.BC + oldResult.metadata.BC,
      NBC: newResult.metadata.NBC + oldResult.metadata.NBC,
      ADD_METHOD: newResult.metadata.ADD_METHOD + oldResult.metadata.ADD_METHOD,
      REMOVE_METHOD: newResult.metadata.REMOVE_METHOD + oldResult.metadata.REMOVE_METHOD,
      ADD_PARAM: newResult.metadata.ADD_PARAM + oldResult.metadata.ADD_PARAM,
      ADD_PARAM_DEFAULT: newResult.metadata.ADD_PARAM_DEFAULT + oldResult.metadata.ADD_PARAM_DEFAULT,
      REMOVE_PARAM: newResult.metadata.REMOVE_PARAM + oldResult.metadata.REMOVE_PARAM,
      ADD_CLASS: newResult.metadata.ADD_CLASS + oldResult.metadata.ADD_CLASS,
      REMOVE_CLASS: newResult.metadata.REMOVE_CLASS + oldResult.metadata.REMOVE_CLASS
    } 
  }
}

function filterRelatableFiles(files) {
  return files
  .filter((file) => file.match(/^(?!.*\.test\.js$).*\.js$/))
  .filter((file) => !file.match(/\/(test|example|internal|benchmark|mock|template|grunt)/))
  .filter((file) => !file.match(/\.config/))
  .filter((file) => !file.match(/\/(\.|\_)/));
}

async function comparerRemote(url, newerTag, olderTag) {
  const newerDirectory = await createWorkspace(url, newerTag, olderTag);
  const olderDirectory = newerDirectory.replace('newer', 'older');

  return comparer(newerDirectory, olderDirectory);
}

async function compareVersions(newerDirectory, olderDirectory, newerTag, olderTag) {
  await gitHandler.checkoutToVersion(newerDirectory, newerTag);
  await gitHandler.checkoutToVersion(olderDirectory, olderTag);

  return comparer(newerDirectory, olderDirectory);
}

async function comparer(newerDirectory, olderDirectory) {
  let newerDirectoryFiles = [];
  let olderDirectoryFiles = [];

  const walker = walk.walk(newerDirectory, { followLinks: false });

  walker.on('file', function(root, stat, next) {
    newerDirectoryFiles.push(root + '/' + stat.name);
    next();
  });

  let result = null;

  const walkingNewFiles = new Promise((resolve, reject) => {
    walker.on('end', function() {
      const filteredFiles = filterRelatableFiles(newerDirectoryFiles);
      filteredFiles.forEach((file) => {
        const olderFileName = file.replace('newer', 'older');

        const newerFile = fs.readFileSync(file, 'utf8');
        const olderFile = fs.existsSync(olderFileName) ? fs.readFileSync(olderFileName, 'utf8') : null;
        const comparerResult = builder.compareFiles(olderFile, newerFile);
        result = mergeResults(comparerResult, result, file);
        if(!comparerResult) {
          console.log(`Could not compare ${file} - ${olderFileName}`);
        }
      });

      resolve(result);
    })
  });

  await walkingNewFiles;

  const walkerOlderDirecty = walk2.walk(olderDirectory, { followLinks: false });

  walkerOlderDirecty.on('file', function(root, stat, next) {
    olderDirectoryFiles.push(root + '/' + stat.name);
    next();
  });

  const walkingOldFiles = new Promise((resolve, reject) => {
    walkerOlderDirecty.on('end', function() {
      const filteredFiles = filterRelatableFiles(olderDirectoryFiles);

      filteredFiles.forEach((file) => {
        const newerFileName = file.replace('older', 'newer');
        const olderFile = fs.readFileSync(file, 'utf8');

        if(!fs.existsSync(newerFileName)) {
          result = mergeResults(builder.compareFiles(olderFile, null), result, file);
        }
      });

      resolve(result);
    })
  });

  await walkingOldFiles;

  return result;
}

async function createWorkspace(url, newerTag, olderTag) {
  const newerDirectory = await gitHandler.cloneRepo(url, 'newer');
  const olderDirectory = newerDirectory.replace('newer', 'older');
  await gitHandler.copyDirectory(newerDirectory, olderDirectory);

  newerTag && await gitHandler.checkoutToVersion(newerDirectory, newerTag);
  olderTag && await gitHandler.checkoutToVersion(olderDirectory, olderTag);

  return newerDirectory;
}

module.exports = {
  comparer,
  comparerRemote,
  compareVersions,
  createWorkspace
};
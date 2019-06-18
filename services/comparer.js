const gitHandler = require('./gitHandler');
const builder = require('./builder');
const walk = require('walk');
const fs = require('fs');
const path = require('path');

function mergeResults(newResult, oldResult) {
  if(!oldResult) return newResult;
  return {
    BC: [...newResult.BC, ...oldResult.BC],
    NBC: [...newResult.NBC, ...oldResult.NBC],
    metadata: {
      BC: newResult.metadata.BC + oldResult.metadata.BC,
      NBC: newResult.metadata.NBC + oldResult.metadata.NBC,
      ADD_METHOD: newResult.metadata.ADD_METHOD + oldResult.metadata.ADD_METHOD,
      REMOVE_METHOD: newResult.metadata.REMOVE_METHOD + oldResult.metadata.REMOVE_METHOD,
      ADD_PARAM: newResult.metadata.ADD_PARAM + oldResult.metadata.ADD_PARAM,
      REMOVE_PARAM: newResult.metadata.REMOVE_PARAM + oldResult.metadata.REMOVE_PARAM,
      ADD_CLASS: newResult.metadata.ADD_CLASS + oldResult.metadata.ADD_CLASS,
      REMOVE_CLASS: newResult.metadata.REMOVE_CLASS + oldResult.metadata.REMOVE_CLASS
    } 
  }
}

async function comparer(url, newerTag, olderTag) {
  const newerDirectory = await createWorkspace(url, newerTag, olderTag);
  let newerDirectoryFiles = [];
  // const walker = walk.walk('/Users/admin/Workspace/javascript-bcs-server/repos/newer/lodash', { followLinks: false });
  const walker = walk.walk(newerDirectory, { followLinks: false });

  walker.on('file', function(root, stat, next) {
    newerDirectoryFiles.push(root + '/' + stat.name);
    next();
  });

  let result = null;
  await new Promise((resolve, reject) => {
    walker.on('end', function() {
      const filteredFiles = newerDirectoryFiles
        .filter((file) => file.match(/^(?!.*\.test\.js$).*\.js$/))
        .filter((file) => !file.match(/test/));

      filteredFiles.forEach((file) => {
        const olderFileName = file.replace('newer', 'older');

        const newerFile = fs.readFileSync(file, 'utf8');
        const olderFile = fs.existsSync(olderFileName) ? fs.readFileSync(olderFileName, 'utf8') : null;
        
        result = mergeResults(builder.compareFiles(olderFile, newerFile), result);

        // TODO: IF THERE IS NO NEWER VERSION ALL METHODS WERE DELETED
      });
      
      resolve(result);
    })
  });

  console.log('finished')
  return result;
}

async function createWorkspace(url, newerTag, olderTag) {
  const newerDirectory = await gitHandler.cloneRepo(url, 'newer');
  const olderDirectory = newerDirectory.replace('newer', 'older');

  await gitHandler.copyDirectory(newerDirectory, olderDirectory); 
  await gitHandler.checkoutToVersion(newerDirectory, newerTag);
  await gitHandler.checkoutToVersion(olderDirectory, olderTag);

  return newerDirectory;
}

module.exports = {
  comparer
};
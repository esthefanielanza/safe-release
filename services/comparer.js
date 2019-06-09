const gitHandler = require('./gitHandler');
const builder = require('./builder');
const walk = require('walk');
const fs = require('fs');

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
  // const newerDirectory = await createWorkspace(url, newerTag, olderTag);
  let newerDirectoryFiles = [];
  const walker  = walk.walk('/Users/admin/Workspace/javascript-bcs-server/repos/newer/lodash', { followLinks: false });

  walker.on('file', function(root, stat, next) {
    newerDirectoryFiles.push(root + '/' + stat.name);
    next();
  });

  let result = null;
  await new Promise((resolve, reject) => {
    walker.on('end', function() {
      newerDirectoryFiles = newerDirectoryFiles
        .filter((file) => file.match(/^(?!.*\.test\.js$).*\.js$/))
        .filter((file) => !file.match(/test/));

      newerDirectoryFiles.forEach((file) => {
        const fileA = fs.readFileSync(file, 'utf8');
        console.log(file)

        const fileB = fs.readFileSync(file.replace('newer', 'older'), 'utf8');
        result = mergeResults(builder.compareFiles(fileA, fileB), result);
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
  console.log(olderDirectory)
  gitHandler.deleteFile(olderDirectory);
  gitHandler.copyDirectory(newerDirectory, olderDirectory); 

  gitHandler.checkoutToVersion(newerDirectory, newerTag);
  gitHandler.checkoutToVersion(olderDirectory, olderTag);

  return newerDirectory;
}

module.exports = {
  comparer
};
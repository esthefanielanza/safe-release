const gitHandler = require('./gitHandler');
const builder = require('./builder');
const walk = require('walk');
const fs = require('fs');

function mergeResults(newResult, oldResult, path) {
  if(!oldResult) return newResult;
  return {
    BC: [...newResult.BC.map(item => ({ ...item, path })), ...oldResult.BC],
    NBC: [...newResult.NBC.map(item => ({ ...item, path })), ...oldResult.NBC],
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

async function comparer(newerDirectory, olderDirectory) {
  let newerDirectoryFiles = [];
  let olderDirectoryFiles = [];

  const walker = walk.walk(newerDirectory, { followLinks: false });
  const walkerOlderDirecty = walk.walk(olderDirectory, { followLinks: false });

  walker.on('file', function(root, stat, next) {
    newerDirectoryFiles.push(root + '/' + stat.name);
    next();
  });

  walkerOlderDirecty.on('file', function(root, stat, next) {
    olderDirectoryFiles.push(root + '/' + stat.name);
    next();
  });

  let result = null;
  const promises = [];

  promises.push(new Promise((resolve, reject) => {
    walker.on('end', function() {
      const filteredFiles = filterRelatableFiles(newerDirectoryFiles);

      filteredFiles.forEach((file) => {
        const olderFileName = file.replace('newer', 'older');

        const newerFile = fs.readFileSync(file, 'utf8');
        const olderFile = fs.existsSync(olderFileName) ? fs.readFileSync(olderFileName, 'utf8') : null;
        result = mergeResults(builder.compareFiles(olderFile, newerFile), result, file);
      });

      resolve(result);
    })
  }));
  
  promises.push(new Promise((resolve, reject) => {
    walkerOlderDirecty.on('end', function() {
      const filteredFiles = filterRelatableFiles(olderDirectoryFiles);

      filteredFiles.forEach((file) => {
        const newerFileName = file.replace('older', 'newer');
        const olderFile = fs.readFileSync(file, 'utf8');

        if(!fs.existsSync(newerFileName)) 
          result = mergeResults(builder.compareFiles(olderFile, null), result, file);
      });

      resolve(result);
    })
  }));

  await Promise.all(promises);

  return result;
}

async function createWorkspace(url, newerTag, olderTag) {
  // const newerDirectory = await gitHandler.cloneRepo(url, 'newer');
  // const olderDirectory = newerDirectory.replace('newer', 'older');
  // console.log(newerDirectory);
  // await gitHandler.copyDirectory(newerDirectory, olderDirectory);
  await gitHandler.checkoutToVersion('/Users/admin/Workspace/javascript-bcs-server/repos/newer/axios', newerTag);
  await gitHandler.checkoutToVersion('/Users/admin/Workspace/javascript-bcs-server/repos/older/axios', olderTag);

  return '/Users/admin/Workspace/javascript-bcs-server/repos/newer/axios';
}

module.exports = {
  comparer,
  comparerRemote
};
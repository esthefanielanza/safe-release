const gitHandler = require('./gitHandler');
const walk = require('walk');


async function comparer(url, newerTag, olderTag) {
  const newerDirectory = await createWorkspace(url, newerTag, olderTag);
  const files = [];
  const walker  = walk.walk(newerDirectory, { followLinks: false });

  walker.on('file', function(root, stat, next) {
    files.push(root + '/' + stat.name);
    next();
  });

  walker.on('end', function() {
      console.log(files);
  })
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
const gitHandler = require('./gitHandler');

async function comparer(url, newerTag, olderTag) {
  await createWorkspace(url, newerTag, olderTag);
}

async function createWorkspace(url, newerTag, olderTag) {
  const newerDirectory = await gitHandler.cloneRepo(url, 'newer');
  const olderDirectory = newerDirectory.replace('newer', 'older');

  gitHandler.deleteFile(olderDirectory);
  gitHandler.copyDirectory(newerDirectory, olderDirectory); 

  gitHandler.checkoutToVersion(newerDirectory, newerTag);
  gitHandler.checkoutToVersion(olderDirectory, olderTag);
}

module.exports = {
  comparer
};

const path = require('path');
const gitPromise = require('simple-git/promise');
const rimraf = require("rimraf");
const fs = require('fs')
const constants = require('./constants');
var copydir = require('copy-dir');

function isDirectory(source) {
  return fs.lstatSync(source).isDirectory();
}

function getDirectories(source) {
  console.info('Is directory valid:', isDirectory(source));
  return isDirectory(source) && fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)
}

function copyDirectory(from, to) {
  copydir.sync(from, to, {
    utimes: true,
    mode: true,
    cover: true
  });
}

async function checkoutToVersion(dir, version) {
  const repoPath = getDirectories(dir)[0];
  const gitRepo = gitPromise(repoPath);
  
  gitRepo.checkout(version);
  console.info(`Checkout to version ${version}`);
}

function deleteFile(dir) {
  fs.existsSync(dir) && rimraf.sync(path.resolve(dir));
}

function createCloneDirectory(folder) {
  const cloneDirectory = `${constants.REPOS}/${folder}`;

  if(!fs.existsSync(constants.REPOS)) fs.mkdirSync(constants.REPOS);
  if(fs.existsSync(cloneDirectory)) deleteFile(cloneDirectory)
  
  fs.mkdirSync(cloneDirectory);
  return path.resolve(cloneDirectory);
}

async function cloneRepo(url, folder) {
  try {
    console.info('Cloning started');

    const cloneDirectory = createCloneDirectory(folder);
    await gitPromise(cloneDirectory).clone(url);

    console.info('Finished cloning');
    return cloneDirectory;
  } catch(e) {
    console.error(e);
  }
}

module.exports = {
  cloneRepo,
  deleteFile,
  checkoutToVersion,
  copyDirectory
};
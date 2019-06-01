
const express = require('express');
const app = express();
const esprima = require('esprima');
const fs = require('fs');

const parseService = require('./services/parser');
const buildService = require('./services/builder');
const gitService = require('./services/gitHandler');

const port = 3000;

const winston = require('winston');

winston.loggers.add('development', {
  console: {
    level: 'silly',
    colorize: 'true',
    label: 'category one'
  },
  file: {
    filename: './somefile.log',
    level: 'warn'
  }
});

app.get('/', function (req, res) {
  res.end('Rotas disponiveis: buildA, buildB, compare, esprima');
});

app.get('/buildA', function (req, res) {
  const fileA = fs.readFileSync('./mocks/example1/1.0/class1.js', 'utf8');
  const result = parseService.buildFileStructure(fileA);
  res.end(JSON.stringify(result))
});

app.get('/buildB', function (req, res) {
  const fileB = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const result = parseService.buildFileStructure(fileB);
  res.end(JSON.stringify(result))
});

app.get('/compare', function (req, res) {
  const fileA = fs.readFileSync('./mocks/example1/1.0/class1.js', 'utf8');
  const fileB = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const result = buildService.compareFiles(fileA, fileB);
  res.end(JSON.stringify(result))
});

app.get('/esprima', function (req, res) {
  const file = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const parsedFile = esprima.parseModule(file)
  res.end(JSON.stringify(parsedFile));
});

app.get('/clone', async function(req, res) {
  const repo = 'https://github.com/lodash/lodash';
  await gitService.cloneRepo(repo);
  res.end('done')
})

app.listen(port, function () {
  console.log('App listening on port 3000 ~');
});
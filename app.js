
const express = require('express');
const app = express();
const esprima = require('esprima');
const fs = require('fs');

const parseService = require('./services/parser');
const buildService = require('./services/builder');
const gitService = require('./services/gitHandler');
const compareService = require('./services/comparer');

const port = 3000;

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

app.get('/compareMocks', function (req, res) {
  const fileA = fs.readFileSync('./mocks/example1/1.0/class1.js', 'utf8');
  const fileB = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const result = buildService.compareFiles(fileA, fileB);
  res.end(JSON.stringify(result))
});

app.get('/compare', async function (req, res) {
  const url = 'https://github.com/lodash/lodash';
  const result = await compareService.comparer(url, '4.17.11', '3.10.0-npm');
  console.log(result)

  res.end(JSON.stringify(result));
});

app.get('/esprima', function (req, res) {
  const file = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const parsedFile = esprima.parseModule(file)
  res.end(JSON.stringify(parsedFile));
});

app.listen(port, function () {
  console.log('App listening on port 3000 ~');
});
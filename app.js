
const express = require('express');
const app = express();
const esprima = require('esprima');
const fs = require('fs');
var readline = require('readline');

const parseService = require('./services/parser');
const buildService = require('./services/builder');
const gitService = require('./services/gitHandler');
const compareService = require('./services/comparer');

const port = 3000;

app.use(express.json())

app.get('/', function (req, res) {
  res.end('Rotas disponiveis: buildA, buildB, compare, esprima');
});

app.get('/buildA', function (req, res) {
  const fileA = fs.readFileSync('./mocks/example1/1.0/class1.js', 'utf8');
  const result = parseService.buildFileStructure(fileA);
  res.json(result)
});

app.get('/buildB', function (req, res) {
  const fileB = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const result = parseService.buildFileStructure(fileB);
  res.json(result)
});

app.post('/compareFiles', function (req, res) {
  const { older, newer } = req.body;

  const fileA = fs.existsSync(older) && fs.readFileSync(older, 'utf8');
  const fileB =  fs.existsSync(older) && fs.readFileSync(newer, 'utf8');

  if(!fileA || !fileB) res.json({ error: 'Arquivo não existe' })

  const result = buildService.compareFiles(fileA, fileB);
  res.json(result)
});

app.post('/compare', async function (req, res) {
  const { repoURL, version = {} } = req.body;
  const { older, newer } = version;
  console.log(repoURL)
  if(!repoURL || !version || !older || !newer)
    return res.status(400).json({ error: 'Parametros inválidos.' });

  const result = await compareService.comparer(repoURL, older, newer);
  res.json(result);
});

app.get('/esprima', function (req, res) {
  const file = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const parsedFile = esprima.parseModule(file)
  res.json(parsedFile);
});

app.listen(port, function () {
  console.log('App listening on port 3000 ~');
});

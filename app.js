
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
  return res.end('Rotas disponiveis: compare, compareFiles, compareRemote');
});

app.get('/buildA', function (req, res) {
  const fileA = fs.readFileSync('./mocks/example1/1.0/class1.js', 'utf8');
  const result = parseService.buildFileStructure(fileA);
  return res.json(result)
});

app.get('/buildB', function (req, res) {
  const fileB = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const result = parseService.buildFileStructure(fileB);
  return res.json(result)
});

app.post('/compareFiles', async function (req, res) {
  const { older, newer } = req.body;
  const fileStatA = fs.existsSync(older) && fs.lstatSync(older);
  const fileStatB = fs.existsSync(newer) && fs.lstatSync(older)
  
  if(!fileStatA.isFile() || !fileStatB.isFile(newer))
    return res.status(400).json({ error: 'Arquivo inválido' })

  const fileA = fs.readFileSync(older, 'utf8');
  const fileB = fs.readFileSync(newer, 'utf8');

  const result = buildService.compareFiles(fileA, fileB);
  return res.json(result)
});

app.post('/compare', async function (req, res) {
  const { older, newer } = req.body;

  if(!older || !newer)
    return res.status(400).json({ error: 'Parametros inválidos.' });

  const directoryStatA = fs.existsSync(older) && fs.lstatSync(older);
  const directoryStatB = fs.existsSync(newer) && fs.lstatSync(older);

  if(!directoryStatA.isDirectory() || !directoryStatB.isDirectory(newer))
    return res.status(400).json({ error: 'Diretório inválido' })

  const result = await compareService.comparer(newer, older);
  return res.json(result);
});

app.post('/compareRemote', async function (req, res) {
  const { repoURL, version = {} } = req.body;
  const { older, newer } = version;

  if(!repoURL || !version || !older || !newer)
    return res.status(400).json({ error: 'Parametros inválidos.' });

  const result = await compareService.comparerRemote(repoURL, older, newer);
  return res.json(result);
});

app.get('/esprima', function (req, res) {
  const file = fs.readFileSync('./mocks/example1/2.0/class1.js', 'utf8');
  const parsedFile = esprima.parseModule(file)
  return res.json(parsedFile);
});

app.listen(port, function () {
  console.log('App listening on port 3000 ~');
});

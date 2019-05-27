const esprima = require('esprima');
const constants = require('./constants');

function getStructureData(structures) {
  const body = structures[0].body
  const structure = {
    entity: structures[0],
    body: Array.isArray(body) ? body : [body]
  }
  structures.shift();
  return structure;
}

function updateStructuresWithNewClass(object, structures) {
  const className = object.id.name;
  const classBody = object.body.body;
  if(classBody) {
    structures.push({ body: classBody, class: className });
  }
}

function checkMethodClass(methods, methodClass) {
  if(!methods[methodClass]) {
    methods[methodClass] = {}
  }
}

function getParams(object) {
  const params = object.value ? object.value.params : object.params;
  return params
    .filter(param => param.type !== constants.DEFAULT_PARAM_TYPE)
    .map(param => param.name);
}

function saveNewMethod(object, entity = {}, methods) {
  const methodName = object.key ? object.key.name : object.id.name;
  const methodClass = entity.class || 'general';
  
  checkMethodClass(methods, methodClass);
  
  methods[methodClass][methodName] = {
    name: methodName,
    params: getParams(object)
  }
}

function handleVariable(object, entity, methods) {
  const methodClass = entity.class || 'general';

  if(!object.declarations) return;
  object.declarations.map(item => {
    if(item.init && item.init.type === constants.ARROW_FUNCTION_TYPE) {
      const method = item.init;

      methods[methodClass][item.id.name] = {
        name: item.id.name,
        params: getParams(method)
      }
    }
  });
}

function handleTypeOfStructures(object, structures, entity, methods) {
  switch (object.type) {
    case constants.CLASS_TYPE:
      updateStructuresWithNewClass(object, structures);
      break;
    case constants.METHOD_TYPE:
    case constants.FUNCTION_TYPE:
      saveNewMethod(object, entity, methods)
      break;
    case constants.VARIABLE_TYPE:
      handleVariable(object, entity, methods);
    default:
      break;
  }
}

function buildFileStructure(file) {
  const esprimaFile = esprima.parseModule(file);
  try {
    const methods = { general: {} };
    const { body: programBody } = esprimaFile

    programBody.forEach(item => {
      if(item.type === constants.EXPORT_TYPE) {
        let structures = [{ body: item.declaration }];

        while(structures.length > 0) {
          let { entity, body } = getStructureData(structures);

          body.forEach(object => {
            handleTypeOfStructures(object, structures, entity, methods)
          });
        }
      }
    })
    
    return methods;
  } catch(e) {
    console.error(e);
    return e;
  }
}

module.exports = {
  buildFileStructure: function(file) {
    return buildFileStructure(file)
  }
};
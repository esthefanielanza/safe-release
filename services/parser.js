const esprima = require('esprima');
const constants = require('./constants');

function getStructureData(structures) {
  const structure = {
    entity: structures[0],
    body: structures[0].body
  }
  structures.pop();
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
  return object.value.params.map(param => param.name);
}

function saveNewMethod(object, entity, methods) {
  const methodName = object.key.name;
  const methodClass = entity.class || 'general';
  
  checkMethodClass(methods, methodClass);
  
  methods[methodClass][methodName] = {
    name: methodName,
    params: getParams(object)
  }
}

function handleTypeOfStructures(object, structures, entity, methods) {
  switch (object.type) {
    case constants.CLASS_TYPE:
      updateStructuresWithNewClass(object, structures);
      break;
    case constants.METHOD_TYPE:
      saveNewMethod(object, entity, methods)
      break;
    default:
      break;
  }
}

function buildFileStructure(file) {
  const esprimaFile = esprima.parseScript(file);
  try {
    let structures = [esprimaFile];
    const methods = { general: {} };

    while(structures.length > 0) {
      const { entity, body } = getStructureData(structures);
      body.forEach(object => {
        handleTypeOfStructures(object, structures, entity, methods)
      });
    }

    return methods;
  } catch(e) {
    console.error(e);
    return e;
  }
}

function compare(structureA, structureB) {
  const results = {};
  Object.keys(structureB).forEach(classObject => {
    const changes = []

    if(!structureA[classObject]) {
      changes.push(`A classe ${classObject} foi adicionada`);
      return;
    }

    Object.keys(structureB[classObject]).forEach(method => {
      const methodDataB = structureB[classObject][method]
      const methodDataA = structureA[classObject][method]

      if(!methodDataA) {
        changes.push(`O metodo ${method}(${methodDataB.params}) foi adicionado`);
      } else {
        const paramsA = methodDataA.params
        const paramsB = methodDataB.params
        if(paramsA.length !== paramsB.length) {
          if(paramsB.length > paramsA.length) {
            paramsB.forEach(param => {
              if(!paramsA.includes(param)) {
                changes.push(`O parametro ${param} foi adicionado ao método ${method}`)
              }
            })
          } else {
            paramsA.forEach(param => {
              if(!paramsB.includes(param)) {
                changes.push(`O parametro ${param} foi removido do metodo ${method}`)
              }
            })
          }
        }
      }
    })

    Object.keys(structureA[classObject]).forEach(method => {
      const methodDataB = structureB[classObject][method]
      const methodDataA = structureA[classObject][method]

      if(!methodDataB) {
        changes.push(`O metodo ${method}(${methodDataA.params}) foi removido`);
      }
    })

    if(changes.length > 0) results[classObject] = changes;
  })

  return results;
}

module.exports = {
  compareFiles: function (fileA, fileB) {
    const structureA = buildFileStructure(fileA);
    const structureB = buildFileStructure(fileB);
    return compare(structureA, structureB);
  },
  buildFileStructure: function(file) {
    return buildFileStructure(file)
  }
};
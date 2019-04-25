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
  return params.map(param => param.name);
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

function handleTypeOfStructures(object, structures, entity, methods) {
  switch (object.type) {
    case constants.CLASS_TYPE:
      updateStructuresWithNewClass(object, structures);
      break;
    case constants.METHOD_TYPE:
    case constants.FUNCTION_TYPE:
      saveNewMethod(object, entity, methods)
      break;
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

function addNewClass(className, classObject) {
  const methods = [];
  Object.keys(classObject).forEach(methodName => {
    methods.push({
      name: methodName,
      params: classObject[methodName].params
    });
  });

  return {
    name: className,
    type: constants.ADD_CLASS,
    methods
  }
}

function removeClass(className) {
  return {
    name: className,
    type: constants.REMOVE_CLASS
  }
}

function addNewMethod(methodName, methodData, className) {
  return { 
    name: methodName,
    params: methodData.params,
    class: className,
    type: constants.ADD_METHOD,
  }
}


function removedMethod(methodName, methodData, className) {
  return { 
    name: methodName,
    params: methodData.params,
    class: className,
    type: constants.REMOVE_METHOD,
  }
}

function addParam(methodName, className, param) {
  return {
    method: methodName,
    class: className,
    param: param,
    type: constants.ADD_PARAM
  }
}

function removeParam(methodName, className, param) {
  return {
    method: methodName,
    class: className,
    param: param,
    type: constants.REMOVE_PARAM
  }
}

function getMethod(structure, className, methodName) {
  return structure[className][methodName];
}

function checkParamChanges(methodDataA, methodDataB, methodName, className) {
  const changes = [];
  const paramsA = methodDataA.params
  const paramsB = methodDataB.params
  
  paramsB.forEach(param => {
    const doesParamExistsOnA = paramsA.includes(param) 
    if(!doesParamExistsOnA) {
      changes.push(addParam(methodName, className, param))
    }
  })

  paramsA.forEach(param => {
    const doesParamExistsOnB = paramsB.includes(param);
    if(!doesParamExistsOnB) {
      changes.push(removeParam(methodName, className, param))
    }
  })

  return changes;
}

function checkIfMethodsChanged(structureA, structureB, className, method) {
  const changes = []
  const methodDataB = getMethod(structureB, className, method);
  const methodDataA = getMethod(structureA, className, method);
  const doesMethodNotExistsOnA = !methodDataA;

  if (doesMethodNotExistsOnA) {
    changes.push(addNewMethod(method, methodDataB, className));
  } else {
    changes.push(...checkParamChanges(methodDataA, methodDataB, method, className));
  }

  return changes;
}

function checkIfMethodsWereRemoved(structureA, structureB, className) {
  const changes = [];
  const methodsInA = structureA[className];

  Object.keys(methodsInA).forEach(method => {
    const methodDataB = getMethod(structureB, className, method);
    const methodDataA = getMethod(structureA, className, method);
    
    if(!methodDataB) {
      changes.push(removedMethod(method, methodDataA, className));
    }
  })

  return changes;
}

function compare(structureA, structureB) {
  const changes = []

  Object.keys(structureB).forEach(className => {
    const doesClassExistOnA = structureA[className]
    const methodsInB = structureB[className];

    if(!doesClassExistOnA) {
      changes.push(addNewClass(className, structureB[className]))
      return;
    }

    Object.keys(methodsInB).forEach(method => {
      changes.push(...checkIfMethodsChanged(structureA, structureB, className, method));
    })

    changes.push(...checkIfMethodsWereRemoved(structureA, structureB, className))
  })

  Object.keys(structureA).forEach(className => {
    const doesClassExistOnB = structureB[className]

    if(!doesClassExistOnB) {
      changes.push(removeClass(className))
      return;
    }
  })

  return changes;
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
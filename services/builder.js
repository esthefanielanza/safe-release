const parseService = require('./parser');
const formatService = require('./formater');
const constants = require('./constants');

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
  let changes = getChangesTypes();
  const paramsA = methodDataA.params
  const paramsB = methodDataB.params
  
  paramsB.forEach(param => {
    const doesParamExistsOnA = paramsA.includes(param)
    if(!doesParamExistsOnA) {
      changes.ADD_PARAM.push(addParam(methodName, className, param))
    }
  })

  paramsA.forEach(param => {
    const doesParamExistsOnB = paramsB.includes(param);
    if(!doesParamExistsOnB) {
      changes.REMOVE_PARAM.push(removeParam(methodName, className, param))
    }
  })

  return changes;
}

function checkIfMethodsChanged(structureA, structureB, className, method) {
  let changes = getChangesTypes();

  const methodDataB = getMethod(structureB, className, method);
  const methodDataA = getMethod(structureA, className, method);
  const doesMethodNotExistsOnA = !methodDataA;

  if (doesMethodNotExistsOnA) {
    const addNewMethodChanges = { ADD_METHOD: [addNewMethod(className, structureB[className])] }
    changes = updateChanges(changes, addNewMethodChanges);
  } else {
    changes = updateChanges(changes, checkParamChanges(methodDataA, methodDataB, method, className))
  }

  return changes;
}

function checkIfMethodsWereRemoved(structureA, structureB, className) {
  let changes = getChangesTypes();
  const methodsInA = structureA[className];

  Object.keys(methodsInA).forEach(method => {
    const methodDataB = getMethod(structureB, className, method);
    const methodDataA = getMethod(structureA, className, method);
    
    if(!methodDataB) {
      const removedMethodChanges = { REMOVE_METHOD: [removedMethod(method, methodDataA, className)] }
      changes = updateChanges(changes, removedMethodChanges);
    }
  })

  return changes;
}

function updateChanges(changes = {}, newChanges = {}) {
  const updatedChanges = JSON.parse(JSON.stringify(changes));
  Object.keys(changes).forEach(change => {
    const newChange = newChanges[change] || []
    updatedChanges[change] = [ ...changes[change], ...newChange ]
  })
  return updatedChanges;
}

function getChangesTypes() { 
  return { 
    ADD_CLASS: [],
    REMOVE_CLASS: [],
    ADD_METHOD: [],
    ADD_PARAM: [],
    REMOVE_PARAM: [],
    REMOVE_METHOD: [] 
  };
}

function compare(structureA, structureB) {
  let changes = getChangesTypes();

  Object.keys(structureB).forEach(className => {
    const doesClassExistOnA = structureA[className];
    const methodsInB = structureB[className];

    if(!doesClassExistOnA) {
      const addNewClassChanges = { ADD_CLASS: [addNewClass(className, structureB[className])] };
      changes = updateChanges(changes, addNewClassChanges);
      return;
    }

    Object.keys(methodsInB).forEach(method => {
      const methodsChanges = checkIfMethodsChanged(structureA, structureB, className, method);
      changes = updateChanges(changes, methodsChanges);
    })

    const removedMethodChanges = checkIfMethodsWereRemoved(structureA, structureB, className);
    changes = updateChanges(changes, removedMethodChanges)
  })

  Object.keys(structureA).forEach(className => {
    const doesClassExistOnB = structureB[className];

    if(!doesClassExistOnB) {
      const removeClassChanges = { REMOVE_CLASS: [removeClass(className)] };
      changes = updateChanges(changes, removeClassChanges);
      return;
    }
  })

  return formatService.formatResponse(changes);
}

module.exports = {
  compareFiles: function (fileA, fileB) {
    const structureA = parseService.buildFileStructure(fileA);
    const structureB = parseService.buildFileStructure(fileB);
    return compare(structureA, structureB);
  }
};
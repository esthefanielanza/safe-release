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

function updateStructuresWithNewClass(object, structures, isExportable) {
  const className = object.id.name;
  const classBody = object.body.body;
  if(classBody) {
    isExportable && isExportable.push(className)
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

function saveNewMethod(object, entity = {}, methods, isExportable) {
  const methodName = object.key ? object.key.name : object.id.name;
  const methodClass = entity.class || 'general';
  
  checkMethodClass(methods, methodClass);
  
  if(methodClass === 'general' && isExportable) {
    isExportable.push(methodName);
  }

  methods[methodClass][methodName] = {
    name: methodName,
    params: getParams(object)
  }
}

function handleVariable(object, entity, methods, isExportable) {
  const methodClass = entity.class || 'general';

  if(!object.declarations) return;

  object.declarations.map(item => {
    if(item.init && item.init.type === constants.ARROW_FUNCTION_TYPE) {
      const method = item.init;

      if(methodClass === 'general' && isExportable) {
        isExportable.push(item.id.name);
      }

      methods[methodClass][item.id.name] = {
        name: item.id.name,
        params: getParams(method)
      }
    }
  });
}

function handleTypeOfStructures(object, structures, entity, methods, isExportable) {
  switch (object.type) {
    case constants.CLASS_TYPE:
      updateStructuresWithNewClass(object, structures, isExportable);
      break;
    case constants.METHOD_TYPE:
    case constants.FUNCTION_TYPE:
      saveNewMethod(object, entity, methods, isExportable)
      break;
    case constants.VARIABLE_TYPE:
      handleVariable(object, entity, methods);
    default:
      break;
  }
}

function saveExportableItem(isExportable, item) {
  if(item.declaration.name) {
    isExportable.push(item.declaration.name)
  } else {
    item.declaration.properties.forEach(innerItem => {
      isExportable.push(innerItem.key.name)
    })
  }
}

function saveModuleExportableItem(isExportable, item) {
  const { left, right }  = item.expression;
  const isModule = left.object && left.object.name === 'module';
  const isExports = left.property && left.property.name === 'exports';
  
  if(isModule && isExports) {
    right.properties && right.properties.map(property => {
      isExportable.push(property.key.name);
    })
  }
}

function buildFileStructure(file) {
  const esprimaFile = esprima.parseModule(file);
  const isExportable = [];

  try {
    const methods = { general: {} };
    const { body: programBody } = esprimaFile

    programBody.forEach(item => {
      if(item.type === constants.EXPORT_TYPE) {
        let structures = [{ body: item.declaration }];

        while(structures.length > 0) {
          let { entity, body } = getStructureData(structures);
          body.forEach(object => {
            handleTypeOfStructures(object, structures, entity, methods, isExportable)
          });
        }
      } else if(item.type === constants.EXPORT_DEFAULT_TYPE) {
        saveExportableItem(isExportable, item)
      } else if(item.type === constants.EXPRESSION_TYPE) {
        saveModuleExportableItem(isExportable, item)
      } else {
        let structures = [{ body: item }];

        while(structures.length > 0) {
          let { entity, body } = getStructureData(structures);
          body.forEach(object => {
            handleTypeOfStructures(object, structures, entity, methods)
          });
        }
      }
    })
    
    const exportableItems = { general: {} }
    Object.keys(methods).forEach(key => {
      if(isExportable.includes(key) || key === 'general') {
        if(key === 'general') {
          Object.keys(methods[key]).map(method => {
            if(isExportable.includes(method))
              exportableItems['general'][method] = methods['general'][method];
          })
        } else {
          exportableItems[key] = methods[key];
        }
      }
    });

    return exportableItems;
  } catch(e) {
    return e;
  }
}

module.exports = {
  buildFileStructure: function(file) {
    return buildFileStructure(file)
  }
};
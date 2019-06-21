function getInitialValue() {
  return { 
    BC: [],
    NBC: [], 
    metadata: { 
      BC: 0, 
      NBC: 0,
      ADD_METHOD: 0,
      REMOVE_METHOD: 0,
      ADD_PARAM: 0,
      REMOVE_PARAM: 0,
      ADD_CLASS: 0,
      REMOVE_CLASS: 0
    } 
  };
}

function splitAddParamBCS(addParamChanges) {
  const addParamBCs = []
  const addParamNBCs = []

  addParamChanges.forEach(change => {
    if(change.param.default) {
      addParamNBCs.push(change)
    } else {
      addParamBCs.push(change)
    }
  })

  return { addParamBCs, addParamNBCs }
}

function formatResponse(changes) {
  const { addParamBCs, addParamNBCs } = splitAddParamBCS(changes.ADD_PARAM);

  const BC = [
    ...changes.REMOVE_METHOD,
    ...addParamBCs,
    ...changes.REMOVE_CLASS
  ];

  const NBC = [
    ...addParamNBCs,
    ...changes.ADD_METHOD,
    ...changes.REMOVE_PARAM,
    ...changes.ADD_CLASS
  ]

  return {
    BC,
    NBC,
    metadata: {
      BC: BC.length,
      NBC: NBC.length,
      ADD_METHOD: changes.ADD_METHOD.length,
      REMOVE_METHOD: changes.REMOVE_METHOD.length,
      ADD_PARAM: changes.ADD_PARAM.length,
      REMOVE_PARAM: changes.REMOVE_PARAM.length,
      ADD_CLASS: changes.ADD_CLASS.length,
      REMOVE_CLASS: changes.REMOVE_CLASS.length
    }
  }
}

module.exports = {
  formatResponse
};
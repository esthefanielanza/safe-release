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

function formatResponse(changes) {
  const BC = [
    ...changes.REMOVE_METHOD,
    ...changes.ADD_PARAM,
    ...changes.REMOVE_CLASS
  ];

  const NBC = [
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
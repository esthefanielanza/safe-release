export class Class1 {
  sum(a) {
    return a + a;
  }

  isLarger(a, b, c) {
    return a > b;
  }
}

export class Class3 {
  throwError(error) {
    throw error;
  }
  
  get className () {
    return 'Class3'
  }
}

export function log(text) {
  console.log(text);
}

// Deveria lidar com esses exports (?)
export const screan = (text) => {
  return `${text}!!!`
}

export const RANDOM_TYPE = 'RANDOM_TYPE'
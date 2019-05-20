export class Class1 {
  sum(a) {
    return a + a;
  }

  isLarger(a, b, c, d ='defaultParam') {
    console.log(c.invalid);
    return a > b;
  }
}

export class Class3 {
  throwError(error) {
    throw error;
  }
}

export function log(text) {
  console.log(text);
}

export const screan = (text) => {
  return `${text}!!!`
}

export const RANDOM_TYPE = 'RANDOM_TYPE'
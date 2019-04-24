export class Class1 {
  sum(a) {
    return a + a;
  }

  multiply(a, b) { 
    return a * b;
  }

  isLarger(a, b, c) {
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
export class Class1 {
  sum(a, b) {
    return a + b;
  }

  isLarger(a, b) {
    return a > b;
  }

  subtract(a, b) {
    return a - b;
  }
}

export class Class2 {
  sayHello() {
    console.log('Say hello');
  }
}

class Class3 {
  throwError(error) {
    throw error;
  }
}

export default {
  Class3
}

export function batata() {
  console.log('batata')
}
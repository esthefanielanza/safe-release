// export class Class1 {
//   sum(a, b) {
//     return a + b;
//   }

//   isLarger(a, b) {
//     return a > b;
//   }

//   subtract(a, b) {
//     return a - b;
//   }
// }

// class Class2 {
//   sayHello() {
//     console.log('Say hello');
//   }
// }

// class Class3 {
//   throwError(error) {
//     throw error;
//   }
// }

// module.exports = {
//   Class3,
//   Class2
// }
// export function batata() {
//   console.log('batata')
// }

var lodash = require('./lodash');

/**
 * Creates a `lodash` object that wraps `value` with explicit method
 * chaining enabled.
 *
 * @static
 * @memberOf _
 * @category Chain
 * @param {*} value The value to wrap.
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36 },
 *   { 'user': 'fred',    'age': 40 },
 *   { 'user': 'pebbles', 'age': 1 }
 * ];
 *
 * var youngest = _.chain(users)
 *   .sortBy('age')
 *   .map(function(chr) {
 *     return chr.user + ' is ' + chr.age;
 *   })
 *   .first()
 *   .value();
 * // => 'pebbles is 1'
 */
function chain(value, b) {
  var result = lodash(value);
  result.__chain__ = true;
  return result;
}

module.exports = chain;

const OPERATOR = Symbol('callback-to-promise-operator');
const NO_PROXY_OPERATOR = Symbol('callback-to-promise-operator-no-proxy');
const RETURNED_VALUE = Symbol('callback-to-promise-returned-value');
const THROWN_VALUE = Symbol('callback-to-promise-thrown-value');
const CALLBACK_ARGUMENTS = Symbol('callback-to-promise-callback-arguments');
const CONTEXT = Symbol('callback-to-promise-proxy-context');

const defineFunctionProperties = (fakeFunction, actualFunction) =>
  Object.defineProperties(fakeFunction, {
    displayName: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: actualFunction.displayName,
    },
    name: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: actualFunction.name,
    },
    length: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: actualFunction.length,
    },
  });

const promisifyFunction = (func, context) => (...args) => {
  let resolve;
  let reject;
  const promise = new Promise((resolveParam, rejectParam) => {
    resolve = resolveParam;
    reject = rejectParam;
  });
  try {
    promise[RETURNED_VALUE] = func.call(context, ...args, (...callbackArgs) => {
      promise[CALLBACK_ARGUMENTS] = callbackArgs;
      if (callbackArgs[0]) {
        reject(callbackArgs[0]);
      } else {
        resolve(callbackArgs[1]);
      }
    });
  } catch (exception) {
    promise[THROWN_VALUE] = exception;
    reject(exception);
  }
  return promise;
};

const noProxyGetter = {
  configurable: false,
  enumerable: false,
  get() {
    const promisified = promisifyFunction(this, undefined);
    defineFunctionProperties(promisified, this);
    return promisified;
  },
};

if (typeof Proxy !== 'undefined') {
  const proxyHandler = {
    get(target, key) {
      const value = target[key];
      if (typeof value === 'function') {
        const promisified = promisifyFunction(value, target);
        defineFunctionProperties(promisified, value);
        return promisified;
      }
      return value;
    },
  };
  const functionProxyHandler = {
    get(target, key) {
      const context = target[CONTEXT];
      const value = context[key];
      if (typeof value === 'function') {
        const promisified = promisifyFunction(value, context);
        defineFunctionProperties(promisified, value);
        return promisified;
      }
      return value;
    },
    has(target, key) {
      const context = target[CONTEXT];
      return key in context;
    },
  };
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Object.prototype, OPERATOR, {
    configurable: false,
    enumerable: false,
    get() {
      let boundOperator;
      if (typeof this === 'function') {
        const target = promisifyFunction(this, undefined);
        defineFunctionProperties(target, this);
        target[CONTEXT] = this;
        boundOperator = new Proxy(target, functionProxyHandler);
      } else {
        boundOperator = new Proxy(this, proxyHandler);
      }
      if (typeof this === 'object' || typeof this === 'function') {
        // eslint-disable-next-line no-extend-native
        Object.defineProperty(this, OPERATOR, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: boundOperator,
        });
      }
      return boundOperator;
    },
  });
} else {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Function.prototype, OPERATOR, noProxyGetter);
}

// eslint-disable-next-line no-extend-native
Object.defineProperty(Function.prototype, NO_PROXY_OPERATOR, noProxyGetter);

export default OPERATOR;
export const noproxy = NO_PROXY_OPERATOR;
export { CALLBACK_ARGUMENTS, RETURNED_VALUE, THROWN_VALUE };

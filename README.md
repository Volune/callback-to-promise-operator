# Callback-To-Promise Operator

[![npm version](https://badge.fury.io/js/callback-to-promise-operator.svg)](https://badge.fury.io/js/callback-to-promise-operator) [![Build Status](https://travis-ci.org/Volune/callback-to-promise-operator.svg?branch=master)](https://travis-ci.org/Volune/callback-to-promise-operator)

An operator that converts asynchronous functions expecting a callback to functions returning a Promise.

## Example

```javascript
// Use whatever variable name that you like for the operator
const $P = require('callback-to-promise-operator').default;

// With an asynchronous function expection a callback
const delayUpperCase = (value, callback) => {
  setTimeout(() => callback(null, value.toUpperCase()), 1000);
};

// Use it as if it was returning a Promise
delayUpperCase[$P]('string')
  .then((result) => {
    console.log(result);
  });
```

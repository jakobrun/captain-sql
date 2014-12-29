'use strict';
var tokenize = require('sql-parser').lexer.tokenize;

function last (array) {
  return array[array.length - 1];
}

module.exports = function(sql) {
  return tokenize(sql).filter(function (t) {
    return t[0] !== 'AS';
  }).reduce(function (array, token) {
    if(token[0] === 'LITERAL' || token[0] === 'SEPARATOR') {
      last(array).tokens.push(token[1]);
    } else {
      array.push({token: token, tokens: []});
    }
    return array;
  }, []).filter(function (t) {
    return t.token[0] === 'FROM' || t.token[0] === 'JOIN';
  }).map(function (t) {
    return t.tokens.join(' ').split(',');
  }).reduce(function (a, t) {
    return a.concat(t);
  }, []).map(function (t) {
    return t.trim().split(' ');
  });
};

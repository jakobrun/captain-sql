'use strict';
var tokenize = require('sql-parser').lexer.tokenize;

function last(array) {
  return array[array.length - 1];
}

module.exports = function(sql) {
  try {
    return tokenize(sql).filter(function(t) {
      return t[0] !== 'AS';
    }).reduce(function(array, token) {
      if (['LITERAL', 'SEPARATOR'].indexOf(token[0]) !== -1 && array.length) {
        last(array).tokens.push(token[1]);
      } else {
        array.push({
          token: token,
          tokens: []
        });
      }
      return array;
    }, []).filter(function(t) {
      return ['FROM', 'JOIN', 'UPDATE'].indexOf(t.token[0]) !== -1;
    }).map(function(t) {
      return t.tokens.join(' ').split(',');
    }).reduce(function(a, t) {
      return a.concat(t);
    }, []).map(function(t) {
      return t.trim().split(' ');
    });
  } catch (e) {
    console.log(e.message, e.stack);
    return [];
  }
};

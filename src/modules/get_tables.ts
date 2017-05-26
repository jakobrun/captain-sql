import { lexer } from 'sql-parser';

function last(array) {
  return array[array.length - 1];
}

export function getTables(sql) {
  try {
    return lexer.tokenize(sql)
      .filter((t) => t[0] !== 'AS')
      .reduce(function (array, token) {
        if (['LITERAL', 'SEPARATOR'].indexOf(token[0]) !== -1 && array.length) {
          last(array).tokens.push(token[1]);
        } else {
          array.push({
            token: token,
            tokens: []
          });
        }
        return array;
      }, [])
      .filter((t) => ['FROM', 'JOIN', 'UPDATE'].indexOf(t.token[0]) !== -1)
      .map((t) => t.tokens.join(' ').split(','))
      .reduce((a, t) => a.concat(t), [])
      .map((t) => t.trim().split(' '));
  } catch (e) {
    console.log(e.message, e.stack);
    return [];
  }
}

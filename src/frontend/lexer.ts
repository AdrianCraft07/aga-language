import { error, ErrorType } from './error';

export const enum TokenType {
  // Types
  Number,
  Identifier,

  // Operators
  Equals, // =
  Negate, // !
  And, // &
  Or, // |

  OpenParen, // (
  CloseParen, // )
  BinaryOperator, // + - * / %
  Semicolon, // ;
  Comma, // ,
  Dot, // .
  Colon, // :
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  EOF, // End of file

  // Keywords
  Def,
  Const,
  Funcion,
  Si,
  Entonces,
}

// reserved keywords
const KEYWORDS: Record<string, TokenType> = {
  def: TokenType.Def,
  const: TokenType.Const,
  funcion: TokenType.Funcion,
  si: TokenType.Si,
  entonces: TokenType.Entonces,
};

export interface Token {
  type: TokenType;
  value: string;
}

function token(value = '', type: TokenType): Token {
  return { value, type };
}

// Validate that the character is a letter
function isAlpha(src: string) {
  return src.match(/[a-z_$0-9]/i) != null;
}

// Validate that the character is a number
function isInt(str: string) {
  const c = str.charCodeAt(0);
  const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
  return c >= bounds[0] && c <= bounds[1];
}

// Validate that the character is a skippable character
function isSkippable(src: string) {
  return src == ' ' || src == '\n' || src == '\t' || src == '\r';
}

// Tokenize the source code
export function tokenize(sourceCode: string): Token[] {
  const tokens: Token[] = [];
  const src = sourceCode.split('');

  while (src.length > 0) {
    if (src[0] == '(') tokens.push(token(src.shift(), TokenType.OpenParen));
    else if (src[0] == ')')
      tokens.push(token(src.shift(), TokenType.CloseParen));
    else if (src[0] == '{')
      tokens.push(token(src.shift(), TokenType.OpenBrace));
    else if (src[0] == '}')
      tokens.push(token(src.shift(), TokenType.CloseBrace));
    else if (src[0] == '[')
      tokens.push(token(src.shift(), TokenType.OpenBracket));
    else if (src[0] == ']')
      tokens.push(token(src.shift(), TokenType.CloseBracket));
    else if (
      src[0] == '+' ||
      src[0] == '-' ||
      src[0] == '*' ||
      src[0] == '/' ||
      src[0] == '%'
    )
      tokens.push(token(src.shift(), TokenType.BinaryOperator));
    else if (src[0] == '=') tokens.push(token(src.shift(), TokenType.Equals));
    else if (src[0] == '!') tokens.push(token(src.shift(), TokenType.Negate));
    else if (src[0] == '&') tokens.push(token(src.shift(), TokenType.And));
    else if (src[0] == '|') tokens.push(token(src.shift(), TokenType.Or));
    else if (src[0] == ';')
      tokens.push(token(src.shift(), TokenType.Semicolon));
    else if (src[0] == ':') tokens.push(token(src.shift(), TokenType.Colon));
    else if (src[0] == ',') tokens.push(token(src.shift(), TokenType.Comma));
    else if (src[0] == '.') tokens.push(token(src.shift(), TokenType.Dot));
    else {
      if (isInt(src[0])) {
        let num = '';
        while (src.length > 0 && isInt(src[0])) {
          num += src.shift();
        }

        tokens.push(token(num, TokenType.Number));
      } else if (isAlpha(src[0])) {
        let id = '';
        while (src.length > 0 && isAlpha(src[0])) {
          id += src.shift();
        }

        const reserved = KEYWORDS[id];

        if (typeof reserved == 'number') tokens.push(token(id, reserved));
        else tokens.push(token(id, TokenType.Identifier));
      } else if (isSkippable(src[0])) src.shift();
      else
        error(
          ErrorType.InvalidSyntax,
          0,
          0,
          `Unrecognized character found in source: ${src[0]}`
        );
    }
  }

  tokens.push(token('EndOfFile', TokenType.EOF));

  return tokens;
}

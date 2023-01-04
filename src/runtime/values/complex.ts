import { ArrayLiteral, BinaryExpr, CallExpr, ElseStatement, FunctionDeclaration, Identifier, IfStatement, MemberExpr, NumericLiteral, ObjectLiteral, Property, PropertyIdentifier, ReturnStatement, Stmt, StringLiteral, VarDeclaration } from '../../frontend/ast';
import Environment from '../environment';
import { RuntimeVal } from '../values';
import { Colors, Properties } from './internal';
import { MK_STRING } from './primitive';

class Complex implements RuntimeVal {
  family: 'complex' = 'complex';
  properties = new Properties();
  static props = {};
  constructor(
    public type: ComplexType,
    properties: { [key: string]: RuntimeVal } = {},
    public parent?: Function,
    values?: any
  ) {
    this.properties.setAll(Object.entries({ ...Complex.props, ...properties }));
    for (let [key, value] of Object.entries(values || {})) {
      this[key] = value;
    }
  }
  __pintar__() {
    let pintar = this.properties.get('__pintar__');
    return pintar.native.call(this);
  }
}

Complex.props = {
  __pintar__: MK_FUNCTION_NATIVE(function () {
    let obj = {};
    for (let [key, value] of this.properties) {
      if (key.startsWith('__') && key.endsWith('__')) continue;
      obj[key] = value.__pintar__();
    }
    return obj;
  }),
};

function unParse(stmt: Stmt): string {
  switch (stmt.kind) {
    case 'VarDeclaration':
      let varDecl = stmt as VarDeclaration;
      let typevar = varDecl.constant ? 'const' : 'def';
      return `${typevar} ${varDecl.identifier} = ${unParse(varDecl.value)};`;
    case 'StringLiteral':
      let str = stmt as StringLiteral;
      let quote = str.value.includes('"') ? "'" : '"';
      return `${quote}${str.value}${quote}`;
    case 'ReturnStatement':
      let ret = stmt as ReturnStatement;
      return `retorna ${unParse(ret.value)};`;
    case 'PropertyIdentifier':
      let propId = stmt as PropertyIdentifier;
      return propId.symbol;
    case 'Property':
      let prop = stmt as Property;
      return `${prop.key}: ${unParse(prop.value)}`;
    case 'ObjectLiteral':
      let obj = stmt as ObjectLiteral;
      let props = obj.properties.map(unParse).join(', ');
      return `{ ${props} }`;
    case 'NumericLiteral':
      let num = stmt as NumericLiteral;
      return num.value.toString();
    case 'MemberExpr':
      let member = stmt as MemberExpr;
      return `${unParse(member.object)}.${unParse(member.property)}`;
    case 'IfStatement':
      let ifStmt = stmt as IfStatement;
      let cond = unParse(ifStmt.condition);
      let then = ifStmt.body.map(unParse).join('\n  ');
      let els = ifStmt.else ? unParse(ifStmt.else) : '';
      return `si (${cond}){ ${then} }${els}`;
    case 'Identifier':
      let id = stmt as Identifier;
      return id.symbol;
    case 'FunctionDeclaration':
      let func = stmt as FunctionDeclaration;
      let code = func.body.map(unParse).join('\n  ');
      let name = func.identifier;
      let params = func.params.join(', ');
      return `funcion ${name}(${params}){${code?`\n  ${code}\n`: ''}}`;
    case 'ElseStatement':
      let elseStmt = stmt as ElseStatement;
      let elseCode = elseStmt.body.map(unParse).join('\n  ');
      return `entonces{ ${elseCode} }`;
    case 'CallExpr':
      let call = stmt as CallExpr;
      let args = call.args.map(unParse).join(', ');
      return `${unParse(call.callee)}(${args})`;
    case 'BinaryExpr':
      let bin = stmt as BinaryExpr;
      return `${unParse(bin.left)} ${bin.operator} ${unParse(bin.right)}`;
    case 'AssignmentExpr':
      let assign = stmt as BinaryExpr;
      return `${unParse(assign.left)} = ${unParse(assign.right)}`;
    case 'ArrayLiteral':
      let arr = stmt as ArrayLiteral;
      let elems = arr.properties.map((prop) => unParse(prop)).join(', ');
      return `[${elems}]`;

    default:
      return stmt.toString();
  }
}

function MK_FUNCTION_PROPS(useProps: boolean) {
  return (
    useProps
      ? {
          __pintar__: MK_FUNCTION_NATIVE(function () {
            return Colors.cyan(`[Funcion: ${this.name || '<anonima>'}]`);
          }),
          aCadena: MK_FUNCTION_NATIVE(function () {
            let code = (this as FunctionVal).body
              .map(unParse)
              .join('\n  ');
            let name = (this as FunctionVal).properties.get('name').value || '';
            let str = `funcion ${name}(${this.params.join(', ')}){${code?`\n  ${code}\n`: this.native ? '[codigo nativo]' : ''}}`;
            console.log(this);
            return MK_STRING(str);
          }, { name: MK_STRING('aCadena')}),
          __typeof__: MK_FUNCTION_NATIVE(() => MK_STRING('funcion')),
          name: MK_STRING(''),
        }
      : {}
  ) as { [key: string]: RuntimeVal };
}

function MK_ARRAY_PROPS() {
  return {
    __pintar__: MK_FUNCTION_NATIVE(function () {
      let list = [];
      for (let [key, value] of this.properties) {
        if (key.startsWith('__') && key.endsWith('__')) continue;
        list.push(value.__pintar__());
      }
      return list;
    }),
    __typeof__: MK_FUNCTION_NATIVE(() => MK_STRING('lista')),
  };
}

//#region ComplexTypes

export type entries = { [key: string]: RuntimeVal };

export type ComplexType = 'objeto' | 'funcion' | string;

export interface ComplexVal extends Complex {}

export function MK_COMPLEX(
  type: ComplexType,
  properties: entries,
  parent?: Function,
  values?: any
): ComplexVal {
  return new Complex(type, properties, parent, values) as ComplexVal;
}

export interface ObjectVal extends ComplexVal {
  type: 'objeto';
}

export function MK_OBJECT(prop: { [key: string]: RuntimeVal } = {}): ObjectVal {
  return MK_COMPLEX('objeto', prop) as ObjectVal;
}

export interface ExtendsObjectVal extends ComplexVal {
  type: string;
  parent: Function;
}

export interface ArrayVal extends ExtendsObjectVal {
  type: 'lista';
  parent: Function;
}

export function MK_ARRAY_NATIVE(...args: RuntimeVal[]): ArrayVal {
  let _args = [...args].map((arg, i) => [i, arg]);
  return MK_ARRAY(Object.fromEntries(_args));
}

export function MK_ARRAY(prop: { [key: string]: RuntimeVal } = {}): ArrayVal {
  return MK_COMPLEX(
    'lista',
    { ...MK_ARRAY_PROPS(), ...prop },
    MK_OBJECT
  ) as ArrayVal;
}

export interface FunctionVal extends ComplexVal {
  type: 'funcion';
  body: Stmt[];
  params: string[];
  env: () => Environment;
  native?: Function;
  name?: string;
}

export function MK_FUNCTION_NATIVE(
  native: Function,
  prop: { [key: string]: RuntimeVal } = {},
  useProps = false
): FunctionVal {
  return MK_FUNCTION([], [], undefined, prop, native, useProps);
}

export function MK_FUNCTION(
  params: string[],
  body: Stmt[],
  env: Environment,
  prop: { [key: string]: RuntimeVal } = {},
  native?: Function,
  useProps = true
): FunctionVal {
  return MK_COMPLEX(
    'funcion',
    { ...MK_FUNCTION_PROPS(useProps), ...prop },
    undefined,
    {
      params,
      body,
      env() {
        return new Environment(env);
      },
      native,
    }
  ) as FunctionVal;
}

//#endregion

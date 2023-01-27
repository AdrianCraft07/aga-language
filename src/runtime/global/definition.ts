import Environment from "../environment";
import consts from "./consts";
import vars from "./vars";

export default function definition(env: Environment){
  vars(env).forEach(([name, value]) => env.declareVar(name, value, false, true));
  consts(env).forEach(([name, value]) => env.declareVar(name, value, true, true));
}
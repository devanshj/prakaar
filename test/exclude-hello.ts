import { T, U, O, B } from "../src/typescript-prelude"
import { IsHello } from "./external/is-hello"

export type ExcludeHello<x> =
  [x] extends [infer _a0] ? 
  [(
    [_a0] extends [infer x] ?
    x extends unknown ?
    ([x] extends [infer x] ?
    B.not<IsHello<x>> : never) extends true ?
    x : never : never : never
  )] extends [infer _a1] ? 
  _a1 : never : never

type test =
  ExcludeHello<"hello" | "world" | "prakaar">

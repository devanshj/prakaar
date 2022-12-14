import { T, U, O, B } from "../src/typescript-prelude"

export type omitFunctionKey<t> =
  { [_k in T.cast<(
      [O.key<t>] extends [infer _a0] ? 
      [(
        [_a0] extends [infer k] ?
        k extends unknown ?
        ([k] extends [infer k] ?
        B.not<T.isSubtype<O.get<t, k>, T.function_>> : never) extends true ?
        k : never : never : never
      )] extends [infer _a1] ? 
      _a1 : never : never
    ), keyof any>]:
      [_k] extends [infer k] ?
      O.get<t, k> : never
  }

type test =
  omitFunctionKey<{
    a: string,
    b: number,
    c: (_: { x: string }) => number,
    d: () => void
  }>

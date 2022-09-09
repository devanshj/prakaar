import { Type, O, U, B, T, p, t } from "../src/prelude"

export let omitFunctionKey = (t: Type) =>
  O.create(
    p(
      O.key(t),
      U.filter(k =>
        B.not(T.isSubtype(O.get(t, k), T.function))
      )
    ),
    k => O.get(t, k)
  )

let test = omitFunctionKey(t<{
  a: string,
  b: number,
  c: (_: { x: string }) => number,
  d: () => void
}>())
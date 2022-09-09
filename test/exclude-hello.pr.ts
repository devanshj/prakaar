import { Type, U, B, p, t } from "../src/prelude"
import { IsHello } from "./external/is-hello"

let isHello = (x: Type) =>
  t<IsHello<typeof x>>()

export let ExcludeHello = (x: Type) =>
  p(x, U.filter(x =>
    B.not(isHello(x))
  ))

let test =
  ExcludeHello(t<"hello" | "world" | "prakaar">())
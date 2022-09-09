import { Type, U, B, p, t } from "../src/prelude"
import { IsHello } from "./external/is-hello"

export let ExcludeHello = (x: Type) =>
  p(x, U.filter(x =>
    B.not(t<IsHello<typeof x>>())
  ))

let test =
  ExcludeHello(t<"hello" | "world" | "prakaar">())
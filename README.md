# Prakaar

Prakaar (hindi for "type") is a type programming language which compiles to and interops with type-level TypeScript. Prakaar itself is also a subset of TypeScript.

You can install it via `npm i -g prakaar`. And use it via cli with `cat foo.pr.ts | prakaar > foo.ts`. Or programmatically with the `prakaar/typescript-compiler` module.

Currently, this is just a proof-of-concept and made for fun. But it probably could have a use-case as it does make type-level TypeScript way more accessible.

Feel free to open an issue for questions or feedback.

## Basic example

```ts
// -------------------------
// ./foo.pr.ts

import { Type, O, U, B, T, p, t } from "prakaar/prelude"

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


// -------------------------
// ./foo.ts (compiled)

import { T, U, O, B } from "prakaar/typescript-prelude"

export type omitFunctionKey<t> =
  { [_k in T.cast<(
      [O.key<t>] extends [infer _a0] ? 
      [(
        [_a0] extends [infer k] ?
        k extends unknown ?
        (B.not<T.isSubtype<O.get<t, k>, T.function_>>) extends true ?
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
```

## Interop example

```ts
// -------------------------
// ./exclude-hello.pr.ts

import { Type, U, B, p, t } from "../src/prelude"
import { IsHello } from "./external/is-hello"

export let ExcludeHello = (x: Type) =>
  p(x, U.filter(x =>
    B.not(t<IsHello<typeof x>>())
  ))


// -------------------------
// ./exclude-hello.ts (compiled)

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


// -------------------------
// ./is-hello.ts

export type IsHello<T> =
  T extends "hello" ? true : false


// -------------------------
// ./test.ts

import { ExcludeHello } from "./exclude-hello.ts"

type Test =
  ExcludeHello<"hello" | "world" | "prakaar">
```

## Future

- Currently the code is really shabby because I just wanted to make a POC. I might rewrite it in PureScript (if I can make good bindings for babel).

- The prelude currently only contains the functions used in the readme examples. After I rewrite this I'd gradually add and implement more prelude functions (and more features in general).

- Optimizations. Eg, `omitFunctionKey` in above output can be optimized to something like this...

```ts
export type omitFunctionKey<t> =
  { [k in keyof t as (
      t[k] extends ((...a: never[]) => unknown) ? k : never
    )]:
      t[k]
  }
```

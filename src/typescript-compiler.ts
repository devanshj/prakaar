import { parseSync as parse, traverse, types as bt } from "@babel/core"
import t from "zod"

type Compile =
  (source: string, options?: CompileOptions) => string

interface CompileOptions
  { preludePath?: string | undefined
  , typescriptPreludePath?: string | undefined
  }

const compile: Compile = (source, options) => {
  let ast = parse(source, {
    parserOpts: { plugins: ["typescript"] },
    filename: "source.ts"
  })!
  preprocess(ast, source)

  let root = l(ast, ast => t.object({ 
    program: t.object({
      type: t.literal("Program"),
      body: t.array(
        (declaration =>
          t.union([
            t.any().refine(bt.isImportDeclaration),
            t.object({
              type: t.literal("ExportNamedDeclaration"),
              declaration
            }),
            declaration
          ])
        )(t.object({
          type: t.literal("VariableDeclaration"),
          declarations: t.tuple([
            t.object({
              type: t.literal("VariableDeclarator"),
              id: t.any().refine(bt.isIdentifier),
              init: t.any().refine(bt.isExpression)
            })
          ])
        }))
      ).nonempty()
    })
  }).parse(ast))

  let preludePath = options?.preludePath ?? "prakaar/prelude"
  let typescriptPreludePath = options?.typescriptPreludePath ?? "prakaar/typescript-prelude"

  return (
    root.program.body
    .filter((d): d is Extract<typeof d, bt.ImportDeclaration> =>
      bt.isImportDeclaration(d)
    )
    .map(d =>
      d.source.value === preludePath
        ? `import { T, U, O, B } from "${typescriptPreludePath}"`
        : source.slice(d.start!, d.end!)
    ).join("\n") + "\n\n" +
    root.program.body
    .filter((d): d is Exclude<typeof d, bt.ImportDeclaration> =>
      !bt.isImportDeclaration(d)
    )
    .map(d => tu([
      d.type === "ExportNamedDeclaration"
        ? d.declaration.declarations[0]
        : d.declarations[0],
      d.type === "ExportNamedDeclaration"
    ]))
    .map(([d, isExported]) =>
      (isExported ? "export " : "") +
      `type ${d.id.name}` + (
        bt.isArrowFunctionExpression(d.init)
          ? (pIds =>
            "<" + pIds.join(", ") + "> =\n" +
            indent("  ", transform(
              parseAs(bt.isExpression, d.init.body),
              { identifiersInScope: pIds, source }
            ))
          )(d.init.params.map(n => parseAs(bt.isIdentifier, n).name))
          : " =\n" + indent("  ", transform(d.init, { identifiersInScope: [], source }))
      )
    )
    .join("\n\n")
  )
}
export default compile

type Preprocess =
  (n: bt.File, source: string) => void

const preprocess: Preprocess = (n, source) => {
  traverse(n, {
    CallExpression: p => {
      let nParsed = t.object({
        callee: t.object({
          type: t.literal("Identifier"),
          name: t.literal("t")
        }),
        typeParameters: t.object({
          type: t.literal("TSTypeParameterInstantiation"),
          params: t.tuple([t.any().refine(bt.isTSTypeReference)])
        })
      }).safeParse(p.node)
      if (!nParsed.success) return
      let n = nParsed.data.typeParameters.params[0]

      p.replaceWithSourceString(
        source.slice(n.start!, n.end!)
        .replace("<", "(")
        .replace(">", ")")
        .replace(/typeof/g, "")
      )
    }
  })
}
  

type Transform =
  (n: bt.Expression, ctx: TransformContext) => string

interface TransformContext
  { identifiersInScope: string[]
  , source: string
  }

const transform: Transform = (n, ctx) => {
  if (bt.isIdentifier(n)) {
    return n.name
  }

  if (bt.isMemberExpression(n)) {
    let id = (
      parseAs(bt.isIdentifier, n.object).name + "." +
      parseAs(bt.isIdentifier, n.property).name
    )
    if (id === "T.function") return "T.function_"
    return id
  }

  if (bt.isCallExpression(n)) {
    if (bt.isMemberExpression(n.callee) || bt.isIdentifier(n.callee)) {
      let id =
        bt.isMemberExpression(n.callee)
          ? parseAs(bt.isIdentifier, n.callee.object).name + "." +
            parseAs(bt.isIdentifier, n.callee.property).name
          : n.callee.name
      
      let as = 
        n.arguments
        .map(n => parseAs(bt.isExpression, n))

      if (id === "t") return ctx.source.slice(
        n.typeParameters!.params[0]!.start!,
        n.typeParameters!.params[0]!.end!
      )

      if (id === "O.create") return Macros["O.create"](
        parseAs(bt.isExpression, as[0]),
        parseAs(bt.isExpression, as[1])
      )(ctx)

      if (id === "p") return Macros.p(
        parseAs(bt.isExpression, as[0]),
        ...as.slice(1)
      )(ctx)

      return `${id}<${as.map(n => transform(n, ctx)).join(", ")}>`
    }

    if (bt.isArrowFunctionExpression(n.callee)) {
      let pIds = n.callee.params.map(id => parseAs(bt.isIdentifier, id).name)

      let as = 
        n.arguments
        .map(n => parseAs(bt.isExpression, n))

      t.literal(pIds.length).parse(as.length)

      return (
        as.map((a, i) =>
          `[${transform(a, ctx)}] extends [infer ${pIds[i]}] ?`
        ).join("\n") + "\n" +
        transform(parseAs(bt.isExpression, n.callee.body), ctx) +
        " : never".repeat(as.length)
      )
    }

    if (bt.isCallExpression(n.callee)) {
      if (bt.isMemberExpression(n.callee.callee) || bt.isIdentifier(n.callee.callee)) {
        let id =
          bt.isMemberExpression(n.callee.callee)
            ? parseAs(bt.isIdentifier, n.callee.callee.object).name + "." +
              parseAs(bt.isIdentifier, n.callee.callee.property).name
            : n.callee.callee.name
        
        if (id === "U.filter") return (
          Macros["U.filter"]
          (parseAs(bt.isArrowFunctionExpression, n.callee.arguments[0]))
          (parseAs(bt.isExpression, n.arguments[0]))
          (ctx)
        )
      }
    }
  }

  throw new Error(`Can't transform node at ${loc(n)}`)
}

const Macros = {
  "O.create": (k: bt.Expression, f: bt.Expression) => (ctx: TransformContext) =>
    l(tempId("_k", ctx), ([kId, ctx]) =>
      `{ [${kId} in T.cast<(\n` + 
        indent("    ", transform(k, ctx)) + "\n" +
      "  ), keyof any>]:" + "\n" +
        indent("    ", transform(
          bt.callExpression(f, [bt.identifier(kId)]),
          ctx
        )) + "\n" +
      `}`
    ),

  "U.filter": (f: bt.ArrowFunctionExpression) => (a: bt.Expression) => (ctx: TransformContext) =>
    l(parseAs(bt.isIdentifier, f.params[0]!).name, aId =>
      "(" + "\n" +
      indent("  ",
        `[${transform(a, ctx)}] extends [infer ${aId}] ?` + "\n" +
        `${aId} extends unknown ?` + "\n" +
        `(${transform(bt.callExpression(f, [bt.identifier(aId)]), ctx)}) extends true ?\n` +
        `${aId} : never : never : never`
      ) + "\n" +
      ")"
    ),

  p: (a: bt.Expression, ...fs: bt.Expression[])=> (ctx0: TransformContext) => {
    let [ids, ctx1] =
      [a, ...fs]
      .reduce(([ids, ctx], _, i) =>
        l(
          tempId("_a" + i, ctx),
          ([id, ctx]) => tu([[...ids, id], ctx])
        ),
        [[], ctx0] as [string[], TransformContext]
      )

    return (
      ids.map((id, i, ids) =>
        i === 0 ? `[${transform(a, ctx1)}] extends [infer ${id}] ? ` :
        `[${
          transform(
            bt.callExpression(fs[i-1]!, [bt.identifier(ids[i-1]!)]),
            ctx1
          )
        }] extends [infer ${id}] ? `
      ).join("\n") + "\n" +
      ids.slice(-1)[0]! + " : never".repeat(ids.length)
    )
  }
}

const tempId = (id: string, ctx: TransformContext): [string, TransformContext] =>
  ctx.identifiersInScope.includes(id)
    ? tempId(
        l(id.match(/_(.*)_(\d+)/), m =>
          m ? ("_" + m[1] + "_" + (Number(m[2]) + 1)) 
            : (id + "_1")
        ),
        ctx
      )
    : [id, { ...ctx, identifiersInScope: [...ctx.identifiersInScope, id] }]

const parseAs = <N extends bt.Node>(f: (n: {}) => n is N, n: bt.Node | undefined) =>
  t.any().refine(f).parse(n)

const loc = (node: bt.Node) => {
  if (!node) return "<unknown>:<unknown>"
  let start = node.loc?.start
  if (!start) return "<unknown>:<unknown>"
  return start.line + ":" + start.column;
}

const indent = (t: string, x: string) =>
  x.split("\n").map(l => t + l).join("\n")

const l = <A, R>(a: A, f: (a: A) => R) => f(a)
const tu = <T extends unknown[]>(t: [...T]) => t

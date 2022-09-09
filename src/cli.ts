import compile from "./typescript-compiler"

const main = async () => {
  const input = await (async () => {
    if (process.stdin.isTTY) return Buffer.alloc(0).toString()
  
    let result = []
    let length = 0
    for await (const chunk of process.stdin) {
      result.push(chunk)
      length += chunk.length
    }
    return Buffer.concat(result, length).toString()
  })()

  if (input === "" || process.argv.includes("--help")) {
    process.stdout.write("cat foo.pr.ts | prakaar > foo.ts")
    return
  }

  let output = compile(input, {
    preludePath: arg("preludePath"),
    typescriptPreludePath: arg("typescriptPreludePath")
  })
  process.stdout.write(output)
}

const arg = (name: string) =>
  process.argv.find((_, i, as) => as[i-1] === "--" + name)

main()
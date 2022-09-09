// @ts-check
const childProcess = require("child_process")
const fs = require("fs/promises")
const { promisify } = require("util")
const exec = promisify(childProcess.exec)
const os = require("os")

;(!process.argv[2]
  ? fs.readdir(__dirname)
    .then(fs => fs.filter(f => f.endsWith(".pr.ts")))
  : Promise.resolve([process.argv[2]])
)
.then(fs =>
  fs.map(f => exec(
    `cat ${f} ` +
    `| ts-node-transpile-only ../src/cli ` +
      `--preludePath "../src/prelude" ` +
      `--typescriptPreludePath "../src/typescript-prelude" ` +
    `> ${f.replace(".pr.ts", ".ts")}`,
    { cwd: __dirname, shell: os.platform() === "win32" ? "powershell" : undefined }
  ))
)
// @ts-check

const fs = require("fs")
const file = __dirname + "/cli/dist/prakaar-cli.cjs.js"

fs.writeFileSync(file, "#!/usr/bin/env node\n\n" + fs.readFileSync(file))
const fs = require("fs");
const path = require("path");

function run(input, output) {
  [
    (x) => ({
      ...x,
      stringData: fs.readFileSync(x.input, { encoding: "utf-8" }),
    }),
    (x) => ({ ...x, data: JSON.parse(x.stringData) }),
  ].reduce((s, i) => i(s), { input, output });
}

const filePath = path.join(__dirname, "resume.json");

run(filePath, filePath);

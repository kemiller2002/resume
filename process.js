const fs = require("fs");

function findValue(data, term) {
  return data[term];
}

function combine(template, data) {
  regex = /\$\{([a-zA-Z.])\}/g;
  35;

  return template.replace(regex, (term) => findValue(data, term));
}

function returnPromise(fn) {
  const accept = (error, data) => data;
  return new Promise((r) => fn((error, data) => r(data)));
}

function processTemplate(template, data) {
  const replacer = (s, p1) => {
    console.log(p1);
    return data[p1];
  };

  return template.replace(/\$\{([a-zA-Z0-1.]+)\}/g, replacer);
}

const voidTags = ["link"];
const nonHtmlSub = ["style"];

function createAttribute() {}

function createSubNode() {
  return { name: "", children: [], attributes: [] };
}

function parseHtmlInput(node, tree) {
  const char = node[0];
  var nextAction;
  switch (char) {
    case "<":
      const subNode = createSubNode();
      nextAction = (c) => (subNode.name += c);

      break;
    case ">":
      break;
    case "/":
      break;
    default:
      break;
  }

  parseHtmlInput(node.slice(1, node.length));
}

function run() {
  const template = fs.readFileSync("template.html", "utf-8");

  const data = fs.readFileSync("resume.json", "utf-8");

  const processedTemplate = processTemplate(template, JSON.parse(data));

  fs.writeFileSync("resume.html", processedTemplate);
}

run();

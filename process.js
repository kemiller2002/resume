const fs = require("fs");
const { sep } = require("path");
const { buffer } = require("stream/consumers");
const path = require("path");

function findValue(data, term) {
  return data[term];
}

function combine(template, data) {
  regex = /\$\{([a-zA-Z.])\}/g;
  35;

  return template.replace(regex, (term) => findValue(data, term));
}

function processTemplate(template, data) {
  const tokenStructure = tokenize(template);
}

function tokenize(html, pTerminatorStack, pNodeStack) {
  const createEmptyNode = () => ({
    parts: [],
    buffer: "",
    closeElement: false,
    children: [],
  });
  const nodeStack = pNodeStack || [createEmptyNode()];
  const terminatorStack = pTerminatorStack || [];
  const node = nodeStack[0];
  const nodeTail = nodeStack.length > 0 ? nodeStack.slice(1) : [];
  const head = (html || "")[0];
  const nextHead = html.length > 1 ? html[1] : undefined;

  const tail = html ? html.slice(1) : "";
  const terminator = terminatorStack[0] || "none";
  const assign = (o, target) =>
    Object.assign(
      {},
      target || node,
      o,
      o.parts
        ? {
            parts: o.parts.filter((x) => x && x !== ""),
          }
        : {}
    );

  const updateNodeStack = (...rest) => [...rest, ...nodeTail];
  const replaceNodeHead = (newNode, sliceCount) => [
    newNode,
    ...nodeStack.slice(sliceCount || 1),
  ];
  const buffer = node.buffer;

  const assignAndReplace = (o) => replaceNodeHead(assign(o));

  switch (terminator) {
    case "element": {
      switch (head) {
        case " ": {
          const newNode = assign({
            buffer: "",
            parts: [...node.parts, buffer],
          });
          const newStackHead = replaceNodeHead(newNode);

          return tokenize(tail, terminatorStack, newStackHead);
        }
        case "/": {
          const newNode =
            buffer !== ""
              ? assign({
                  buffer: "",
                  parts: [...node.parts, buffer],
                })
              : node;

          const parent = nodeStack[1];
          const parentWithChild = assign(
            {
              children: [...parent.children, newNode],
            },
            parent
          );

          const newNodeStack = replaceNodeHead(parentWithChild, 2);
          const newTail = tail.substring(tail.indexOf(">"));
          return tokenize(newTail, terminatorStack, newNodeStack);
        }
        case ">":
          return tokenize(tail, terminatorStack.slice(1), nodeStack);
        default:
          return tokenize(
            tail,
            terminatorStack,
            assignAndReplace({ buffer: node.buffer + head })
          );
      }
    }
    case "double-quote": {
      switch (head) {
        case '"':
          return tokenize(
            tail,
            terminatorStack.slice(1),
            assignAndReplace({ buffer: node.buffer + head })
          );
          break;
        default:
          return tokenize(
            tail,
            terminatorStack,
            assignAndReplace({ buffer: node.buffer + head })
          );
      }
    }
    default: {
      switch (head) {
        case "<": {
          const emptyNode = createEmptyNode();
          const terminatorStackUpdated = ["element", ...terminatorStack];
          const nodeStackUpdated = [emptyNode, ...nodeStack];

          return tokenize(tail, terminatorStackUpdated, nodeStackUpdated);
        }
        case undefined: {
          return node;
        }
        default:
          return tokenize(
            tail,
            terminatorStack,
            assignAndReplace({ buffer: node.buffer + head })
          );
      }
    }
  }
}

function run() {
  const template = fs.readFileSync("template.html", "utf-8");

  const data = fs.readFileSync("resume.json", "utf-8");

  const processedTemplate = processTemplate(template, JSON.parse(data));

  fs.writeFileSync("resume.html", processedTemplate);
}

function logOutput(input) {
  fs.writeFileSync(
    path.join(__dirname, "test", `${input.replace(/[ \/]/g, "-")}.json`),
    JSON.stringify([input, tokenize(input)])
  );
}

function test() {
  logOutput("<section list=whoa />");
  //logOutput(`<section>`);
  //logOutput(`<section`);
  //logOutput(`<section />`);
  logOutput(`<section input="test"/>`);
  logOutput('<section list="double>quote" />'); //here
  //logOutput(`<section list='do" + '"uble>quote">`);
  //logOutput("<section>inside<section>second</section></section>");
}

test();

//run();

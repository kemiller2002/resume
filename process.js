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
  const createEmptyNode = (o) =>
    Object.assign(
      {
        parts: [],
        buffer: "",
        closeElement: false,
        children: [],
      },
      o
    );
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

  log([head, ...arguments]);

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
        case '"': {
          const newNode = assign({
            buffer: node.buffer + head,
          });
          const newStackHead = replaceNodeHead(newNode);

          return tokenize(
            tail,
            ["double-quote", ...terminatorStack],
            newStackHead
          );
        }
        case "/": {
          /*
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
          */

          const newNodeStack = assignAndReplace({ closeElement: true });

          return tokenize(tail, terminatorStack, newNodeStack);
        }
        case ">":
          /*START */

          //maybe remove and handle tree after tokenizer.
          if (node.closeElement) {
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
            const newTail = tail;
            return tokenize(newTail, terminatorStack, newNodeStack);
          }

          /*HERE*/
          const newStackUpdatedHead = assignAndReplace({
            buffer: "",
            parts: [...node.parts, node.buffer],
          });

          const newNodeStack = [createEmptyNode(), ...newStackUpdatedHead];

          return tokenize(tail, terminatorStack.slice(1), newNodeStack);
        default:
          if (!head) {
            return node;
          }
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
          const elementType = nextHead == "/" ? "close" : "open";
          const emptyNode = createEmptyNode({ elementType });
          const terminatorStackUpdated = ["element", ...terminatorStack];
          const bufferedHead = assign({
            buffer: "",
            parts: [...node.parts, node.buffer],
          });
          const nodeStackUpdated = [emptyNode, bufferedHead, ...nodeTail];

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

let output = [];
function log() {
  //console.log(arguments);
  output.push(arguments);
}

function logOutput(input) {
  output = [];
  console.log("start");
  log("start");
  try {
    log(input);
    log(tokenize(input));
  } catch (e) {
    log({ message: e.message, stack: e.stack.split("\n") });
    //throw e;
    console.log(e.message);
  } finally {
    fs.writeFileSync(
      path.join(__dirname, "test", `${input.replace(/[ \/]/g, "-")}.json`),
      JSON.stringify(output)
    );
  }
}

function test() {
  //logOutput("<section list=whoa />");
  //logOutput(`<section>`);
  //logOutput(`<section`);
  //logOutput(`<section />`);
  //logOutput(`<section input="test"/>`);
  //logOutput('<section list="double>quote" />'); //here
  //logOutput('<section list="double>quote"/>'); //here
  //logOutput(`<section list='do" + '"uble>quote">`);
  logOutput("<section>inside<section>second</section></section>");
}

test();

//run();

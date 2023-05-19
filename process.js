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
  const nodeStack = pNodeStack || [];
  const terminatorStack = pTerminatorStack || [];
  const node = nodeStack.length > 0 ? nodeStack[0] : createEmptyNode();
  const nodeTail = nodeStack.length > 0 ? nodeStack.slice(1) : [];
  const head = (html || "")[0];
  const nextHead = html.length > 1 ? html[1] : undefined;

  const tail = html ? html.slice(1) : "";
  const terminator = terminatorStack[0] || "none";
  const assign = (o) =>
    Object.assign(
      {},
      node,
      o,
      o.parts
        ? {
            parts: o.parts.filter((x) => x && x !== ""),
          }
        : {}
    );

  const updateNodeStack = (...rest) => [...rest, ...nodeTail];
  console.log("buffer:", node.buffer, terminator, head);
  if (html.length == 0) {
    return assign({ parts: [...node.parts, node.buffer], buffer: "" });
  }
  console.log(nodeStack);
  switch (terminator) {
    case "none":
      const parent = assign({
        buffer: "",
        parts: [...node.parts, node.buffer],
      });
      if (head === "<") {
        return tokenize(
          tail,
          ["close-element", ...terminatorStack],
          updateNodeStack(createEmptyNode(), parent)
        );
      }

      return tokenize(
        tail,
        [...terminatorStack],
        updateNodeStack(assign({ buffer: node.buffer + head }))
      ); //HERE
    case "close-element":
      switch (head) {
        case ">":
          const updatedNode = assign({
            parts: node.closeElement
              ? [...node.parts]
              : [...node.parts, node.buffer],
            buffer: "",
          });

          //here setting child to parent node.
          const parentNode = nodeTail[0] || createEmptyNode();

          const newParentNode = Object.assign({}, parentNode, {
            children: [...parentNode.children, updatedNode],
          });

          return tokenize(
            tail,
            terminatorStack.slice(1),
            updateNodeStack(updatedNode)
          );

        case "/": {
          const updatedNode = assign({
            parts: [...node.parts, node.buffer],
            buffer: "",
            closeElement: true,
          });

          const parent = nodeTail[0];
          const parentWithNewChild = Object.assign({}, parent, {
            children: [...parent.children, updatedNode],
          });

          console.log(updatedNode);

          const newNodeStack = [parentWithNewChild, ...nodeTail.slice(1)];

          return tokenize(tail, terminatorStack, newNodeStack);
        }
        case " ": {
          return tokenize(
            tail,
            terminatorStack,
            updateNodeStack(
              assign({
                parts: [...node.parts, node.buffer],
                buffer: "",
              })
            )
          );
        }
        case '"': {
          return tokenize(
            tail,
            ["double-quote", ...terminatorStack],
            updateNodeStack(
              assign({
                buffer: node.buffer + head,
              })
            )
          );
        }
      }

      return tokenize(
        tail,
        terminatorStack,
        updateNodeStack(
          assign({
            buffer: node.buffer + head,
          })
        )
      );
    case "single-quote":
      switch (head) {
        case "'":
          return tokenize(
            tail,
            terminatorStack.slice(1),
            updateNodeStack(assign({ buffer: node.buffer + head }))
          );

        default:
          return tokenize(
            tail,
            terminatorStack,
            updateNodeStack(assign({ buffer: node.buffer + head }))
          );
      }
    case "double-quote":
      switch (head) {
        case '"':
          return tokenize(
            tail,
            terminatorStack.slice(1),
            updateNodeStack(assign({ buffer: node.buffer + head }))
          );

        default:
          return tokenize(
            tail,
            terminatorStack,
            updateNodeStack(assign({ buffer: node.buffer + head }))
          );
      }
    default:
      switch (head) {
        case '"':
          const terminatorStack = [...terminatorStack, "double-quote"];
          return tokenize(
            tail,
            terminatorStack,
            updateNodeStack(assign({ buffer: node.buffer + head }))
          );
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
  //logOutput(`<section input="test"/>`);
  //logOutput('<section list="double>quote">');
  //logOutput(`<section list='do" + '"uble>quote">`);
  logOutput("<section>inside<section>second</section></section>");
}

test();

//run();

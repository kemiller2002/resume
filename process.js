const fs = require("fs");
const { sep } = require("path");
const { buffer } = require("stream/consumers");

function findValue(data, term) {
  return data[term];
}

function combine(template, data) {
  regex = /\$\{([a-zA-Z.])\}/g;
  35;

  return template.replace(regex, (term) => findValue(data, term));
}

function processTemplate(template, data) {
  const replacer = (s, p1) => {
    return data[p1];
  };

  return template.replace(/\$\{([a-zA-Z0-1.]+)\}/g, replacer);
}

function separateElement(html, terminatorStack, pNode) {
  const createEmptyNode = (parent) => ({
    parts: [],
    buffer: "",
    closeElement: false,
    parent,
    children: [],
  });

  const node = pNode || createEmptyNode();

  if (html.length == 0) {
    return node;
  }

  const head = html[0];
  const tail = html.slice(1);
  const terminator = terminatorStack[0] || "";

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

  switch (terminator) {
    case "":
      if (head === "<") {
        return separateElement(
          tail,
          ["close-element", ...terminatorStack],
          node
        );
      }
      return separateElement(
        tail,
        [...terminatorStack],
        assign({ buffer: node.buffer + head })
      );
    case "close-element":
      switch (head) {
        case ">":
          const updatedNode = assign({
            parts: [...node.parts, node.buffer],
            buffer: "",
          });

          return separateElement(
            tail,
            terminatorStack.slice(1),
            node.closeElement ? updatedNode : createEmptyNode(updatedNode)
          );

        case "/": {
          const updatedNode = assign({
            parts: [...node.parts, node.buffer],
            buffer: "",
            closeElement: true,
          });

          const parent = Object.assign({}, updatedNode.parent, {
            children: [...updatedNode.children, updatedNode],
          });

          return separateElement(tail, terminatorStack, parent);
        }
        case " ": {
          return separateElement(tail, terminatorStack, {
            parts: [...node.parts, node.buffer],
            buffer: "",
          });
        }
        case '"': {
          return separateElement(
            tail,
            ["double-quote", ...terminatorStack],
            assign({
              buffer: node.buffer + head,
            })
          );
        }
      }

      return separateElement(
        tail,
        terminatorStack,
        assign({
          buffer: node.buffer + head,
        })
      );
    case "single-quote":
      switch (head) {
        case "'":
          return separateElement(
            tail,
            terminatorStack.slice(1),
            assign({ buffer: node.buffer + head })
          );

        default:
          return separateElement(
            tail,
            terminatorStack,
            assign({ buffer: node.buffer + head })
          );
      }
    case "double-quote":
      switch (head) {
        case '"':
          return separateElement(
            tail,
            terminatorStack.slice(1),
            assign({ buffer: node.buffer + head })
          );

        default:
          return separateElement(
            tail,
            terminatorStack,
            assign({ buffer: node.buffer + head })
          );
      }
    default:
      switch (head) {
        case '"':
          const terminatorStack = [...terminatorStack, "double-quote"];
          return separateElement(
            tail,
            terminatorStack,
            assign({ buffer: node.buffer + head })
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

function test() {
  /*
  console.log(separateElement("<section list=whoa>", []));
  console.log(separateElement(`<section />`, []));
  console.log(separateElement('<section list="double>quote">', []));
  console.log(separateElement(`<section list='do" + '"uble>quote">`, []));*/
  console.log(separateElement("<section>inside</section>", []));
}

test();

//run();

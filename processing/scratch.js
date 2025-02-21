const training =
  "Functional Programming, Regular Expressions, Date and Time programming, CQRS, Dependency Injection, Clean Code, Expression Trees, Higher Order Functions, JavaScript Context, Gestalt Design Principles, .NET Optimizations)";

const split = training
  .split(",")
  .map((x) => x.trim())
  .map((x) => `"{x}"`);

console.log(split);

function parse(node, html, mode) {
  const head = html[0];
  const tail = html.slice(1);

  switch (mode) {
    case "element-name":
      if (head == " " || head === "/" || head === ">") {
        return { name: node, currentHead: head, currentTail: tail };
      } else {
        return parse((node += head), tail, mode);
      }
  }

  if (head === "<") {
    const { name, currentHead, currentTail } = parse("", tail, "element-name");
    const currentNode = createNode(name, node);

    switch (currentHead) {
      case " ":
        break;
      case "/":
        //closed tag.
        //look for close element

        console.log("HERE");
        break;
      case ">":
        break;
    }
  }
}

function tokenize_old(html, pTerminatorStack, pNodeStack) {
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
  if (html.length == 0) {
    return assign({ parts: [...node.parts, node.buffer], buffer: "" });
  }

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

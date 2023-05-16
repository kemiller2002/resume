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

function loadData() {
  fetch("resume.json")
    .then((x) => x.json())
    .then((x) => process(this.document.body, x));
}

function getForEach(node) {
  return node.getAttribute ? node.getAttribute("for-each") : undefined;
}

function locateData(data, indexer) {
  return data ? data[indexer] : null;
}

function cloneAndAppend(node) {
  const newNode = node.cloneNode(true);
  node.after(newNode);
  return newNode;
}

function processForEach(node, data) {
  node.removeAttribute("for-each");

  const nodeArray = data.map((d) => ({
    node: cloneAndAppend(node),
    data: d,
  }));

  node.remove();

  nodeArray.forEach((item) => process(item.node, item.data));
}

function checkExistsCommand(node, locateData) {
  const ifAttribute = node.getAttribute && node.getAttribute("exists");

  if (ifAttribute) {
    const indexer = ifAttribute.replace("${", "").replace("}", "");
    return locateData(indexer);
  }

  return true;
}

function process(node, data) {
  const dataLocator = (_, property) =>
    property.split(".").reduce(locateData, data);

  if (!checkExistsCommand(node, (x) => dataLocator(null, x))) {
    node.remove();
  }

  const feCommand = getForEach(node);

  if (feCommand) {
    const [indexer, variable] = feCommand
      .replace("${", "")
      .replace("}", "")
      .split(" as ");

    const dataSubset = dataLocator(variable, indexer, feCommand) || [];

    const dataSubsetAsObjectArray = dataSubset
      .reverse()
      .map((d) => ({ [variable]: d }));

    processForEach(node, dataSubsetAsObjectArray);
  } else {
    node.nodeValue = (node.nodeValue || "").replace(
      /\$\{([a-zA-Z0-9.]+)\}/g,
      dataLocator
    );

    const nodesToProcess = [...node.childNodes];

    nodesToProcess.forEach((x) => process(x, data));
  }
}

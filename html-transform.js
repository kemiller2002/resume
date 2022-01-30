function loadData() {
  fetch("resume-test.json")
    .then((x) => x.json())
    .then((x) => process(this.document.body, x));
}

/*function processForEachO(node, data) {
  if (node.getAttribute) {
    const statement = node.getAttribute("for-each");

    if (statement && statement.indexOf("${") > -1) {
      const [property, variable] = statement
        .replace("${", "")
        .replace("}", "")
        .split(" as ");

      if (statement.indexOf("responsibilities") > -1) {
        console.log(node, data);
      }

      const propertyData = property.split(".").reduce(locateData, data);

      node.removeAttribute("for-each");

      const dataAndNode = (propertyData || [])
        .reverse()
        .map((d) => ({ data: d, node: node.cloneNode(true) }));

      dataAndNode.forEach((x) => node.after(x.node));

      dataAndNode.forEach((x) => {
        const { data, node } = x;
        process(node, data.map({ [variable]: data });
      });

      node.remove();

      return true;
    }
  }

  return false;
}*/
/*
function processX(node, data) {
  if (!processForEach(node, data)) {
    node.childNodes.forEach((x) => process(x, data));

    const replacer = (s, property) =>
      property.split(".").reduce(locateData, data);

    console.log(node.nodeValue);

    node.nodeValue = (node.nodeValue || "").replace(
      /\$\{([a-zA-Z0-9.]+)\}/g,
      replacer
    );
  }
}*/

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
  console.log(node, data);

  const nodeArray = data.map((d) => ({
    node: cloneAndAppend(node),
    data: d,
  }));

  node.remove();

  nodeArray.forEach((item) => process(item.node, item.data, true));
}

function process(node, data, isForEach) {
  const feCommand = getForEach(node);

  const dataLocator = (_, property) =>
    property.split(".").reduce(locateData, data);

  if (feCommand) {
    const [indexer, variable] = feCommand
      .replace("${", "")
      .replace("}", "")
      .split(" as ");

    const dataSubset = dataLocator(variable, indexer, feCommand);

    const dataSubsetAsObjectArray = dataSubset.map((d) => ({
      [variable]: d,
    }));
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

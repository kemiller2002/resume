const fs = require("fs");

function findValue(data, term) {
  return data[term];
}

function combine(template, data) {
  regex = /\$\{([a-zA-Z.])\}/g;

  return template.replace(regex, (term) => findValue(data, term));
}

function returnPromise(fn) {
  const accept = (error, data) => data;
  return new Promise((r) => fn((error, data) => r(data)));
}

function run() {
  const template = (f) => fs.readFile("template.html", "utf-8", f);

  const data = (f) => fs.readFile("resume.json", "utf-8", f);

  const allPromises = [template, data].map((x) => promise);

  Promise.all(allPromises, (promises) =>
    combine(promises[0], promises[1])
  ).then((x) => fs.writeFile("resume.html", x));
}

run();

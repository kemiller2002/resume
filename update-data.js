const fs = require("fs");

function execute(s, i) {
  return i(s);
}

function loadFile(path) {
  return fs.readFileSync(path);
}

function writeFile(path) {
  return fs.writeFileSync(path);
}

function addCategory(project) {
  Object.assign({}, { categories: [] }, project);
}

function editEmployment(data) {
  const employment = data.employment.map((x) =>
    Object.assign({}, x, { projects: x.projects.map((p) => addCategory(p)) })
  );

  return Object.assign({}, data, { employment });
}

function run(filePath) {
  const steps = [loadFile, editEmployment, writeFile];

  return steps.reduce(execute, filePath);
}

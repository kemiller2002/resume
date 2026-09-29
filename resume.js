// Application logic for the resume pages. resume.json, its schema, filtering,
// sorting, and date formatting are owned here; Folio only styles the semantic
// HTML these bindings produce.

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pipe = (value, ...steps) => steps.reduce((state, step) => step(state), value);

const toDate = ({ month, year }) => new Date(Number(year), Math.max(monthNames.indexOf(month), 0), 1);

function sortByStart(a, b) {
  return toDate(b.start) - toDate(a.start);
}

function sortByTopic(a, b) {
  return a.topic - b.topic;
}

function sortByImportanceHigh(a, b) {
  return b.importance - a.importance;
}

function sortAlphabetical(a, b) {
  return a.localeCompare(b);
}

// "February 2024" / "2024"
const displayDate = date => [date.month, date.year].filter(Boolean).join(" ");

// "2024-02" / "2024" for <time datetime>
const isoDate = date => pipe(
  monthNames.indexOf(date.month),
  index => index >= 0 ? `${date.year}-${String(index + 1).padStart(2, "0")}` : String(date.year),
);

const phoneNumber = phone => [phone.areaCode, phone.prefix, phone.suffix].join(".");

function getTechnologyGroupings(technologies) {
  return Reflect.ownKeys(technologies).map(name => ({ name, technologies: technologies[name] }));
}

function getTechnologyNames(technologyGrouping) {
  return pipe(
    technologyGrouping.technologies,
    technologies => Reflect.ownKeys(technologies).filter(name => technologies[name].active),
    names => names.toSorted(),
  );
}

// Groups with no active technology are omitted instead of printing an empty heading.
const getActiveTechnologyGroupings = technologies =>
  getTechnologyGroupings(technologies).filter(group => getTechnologyNames(group).length > 0);

window.addEventListener(
  "DOMContentLoaded",
  () =>
    fetch("resume.json")
      .then(response => response.json())
      .then(resume => ({ ...resume, display: true }))
      .then(resume => ({ ...resume, employment: resume.employment.toSorted(sortByStart) }))
      .then(resume => ko.applyBindings(resume)),
  false,
);

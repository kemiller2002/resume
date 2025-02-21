import reducer from "./Reducer";

function formatDate(dateObject) {
  return [(d) => `${d.month} - ${d.year}`].reduce(reducer, dateObject);
}

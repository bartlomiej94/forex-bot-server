const express = require("express");
const app = express();
const port = 80;
const handleJSON = require("./actions/handleJSON");

app.listen(port, () => {
  console.log(`Listening to port ${port}...`);
});

app.get("/hiddenroute", (req, res) => {
  // Remove backslash.
  let route = req.originalUrl.substr(1);
  const splitRoute = route.split("_");
  const action = splitRoute[0];
  // Remove query string from the fileName.
  const fileName = splitRoute[1].split("?")[0];

  if (action && fileName) redirectRoute(action, fileName, req.query, res);
});

// Find a way to merge it to GET route. It's the same code.
app.get("/hiddenroute", (req, res) => {
  // Remove backslash.
  let route = req.originalUrl.substr(1);
  const splitRoute = route.split("_");
  const action = splitRoute[0];
  // Remove query string from the fileName.
  const fileName = splitRoute[1].split("?")[0];

  if (action && fileName) redirectRoute(action, fileName, req.query, res);
});

app.post("/hiddenroute", (req, res) => {
  // Remove backslash.
  let route = req.originalUrl.substr(1);
  const splitRoute = route.split("_");
  const action = splitRoute[0];
  const fileName = splitRoute[1].split("?")[0];

  // Show error and terminate the program if GET is sent as POST.
  if (action === "GET")
    throw new Error("Illegal route: GET action sent as a POST request!");

  if (action && fileName) redirectRoute(action, fileName, req.query, res);
});

const redirectRoute = (action, fileName, query, res) => {
  let response;
  const filter = query.filter || null;
  const flag = query.flag || null;
  const target = query.target || null;
  const page = query.page || null;
  const data = query;

  delete data.filter;
  delete data.flag;
  delete data.target;
  delete data.page;

  // Query format: ACTION_FILENAME?data={...}&filter=key|value,key|value,{...}
  switch (action) {
    case "GET":
      response = handleJSON.get(fileName, filter, page);
      // To prevent sending 0 as a response, transform numbers to strings.
      response = typeof response === "number" ? response.toString() : response;
      res.send(response);
      break;
    case "INSERT":
      handleJSON.insert(data, fileName);
      res.send("OK");
      break;
    case "REPLACE":
      handleJSON.replace(fileName, filter, target, flag);
      res.send("OK");
      break;
    case "DELETE":
      handleJSON.delete(fileName, filter, flag);
      res.send("OK");
      break;
    case "WIPE":
      handleJSON.wipe(fileName);
      res.send("OK");
      break;
    case "GETONE":
      // Get all the values but from one key only. Returns either ticket:value or ticket only.
      response = handleJSON.getOne(fileName, filter);
      response = typeof response === "number" ? response.toString() : response;
      res.send(response);
      break;
    default:
      throw new Error(`Illegal route: unknown action type '${action}'!`);
  }
};

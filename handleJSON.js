const fs = require("fs");

const pageSize = 30;

module.exports = {
  read: function(fileName) {
    const data = fs.readFileSync(`./../json/${fileName}.json`).toString("utf8");
    const parsedData = JSON.parse(data);
    return parsedData;
  },
  write: function(data, fileName, source, count = 1, tickets, mods, flag) {
    fs.writeFileSync(`./../json/${fileName}.json`, JSON.stringify(data));
    const ticketPrefixRe = /[0-9]/;
    const ticketPrefix = ticketPrefixRe.test(tickets[0]) ? "#" : "";
    let logPrefix;
    //const ticketPrefix = tickets[0] && tickets[0]
    let ticketList = "";

    // Create ticket list.
    if (tickets)
      tickets.forEach(ticket => {
        ticketList += `${ticketPrefix}${ticket}, `;
      });

    // Remove the last comma from the ticket list when the loop ends.
    if (tickets) ticketList = ticketList.trim().slice(0, -1);

    // Add mods if applicable.
    if (mods && mods.length > 0) {
      mods.forEach(mod => {
        ticketList += `, ${mod}`;
      });
    }

    switch (source) {
      case "delete":
        logPrefix = `Removed ${
          count === 1 ? "an entry" : count + " entries"
        } from`;
        break;
      case "replace":
        logPrefix = `Modified ${
          count === 1 ? "an entry" : count + " entries"
        } in`;
        break;
      default:
        logPrefix = `Added ${
          count === 1 ? "a new entry" : count + " new entries"
        } to`;
    }

    if (flag === "silent") return;
    return console.log(
      `${getDateNow()}: ${logPrefix} ${fileName}.json. ${
        ticketList.length > 0 ? `(${ticketList})` : ""
      }`
    );
  },
  get: function(fileName, filter, page) {
    const curData = this.read(fileName);
    const keyArr = [];
    const valueArr = [];

    if (!filter && !page) return curData.data;

    let newData = [...curData.data].reverse();

    // Get specific pages.
    if (!filter && page) {
      const start = page * pageSize - pageSize;
      newData = newData.splice(start, pageSize);

      return newData;
    }

    // If only data size was requested.
    if (filter === "length") return curData.data.length;

    const filterArr = filter.split(",");

    // Extract keys and values from filter array.
    filterArr.forEach(filter => {
      keyArr.push(filter.split("|")[0]);
      valueArr.push(filter.split("|")[1]);
    });

    // Filter the new array with previously stored keys and values.
    keyArr.forEach((key, index) => {
      newData = newData.filter(data => {
        return data[key] === valueArr[index];
      });
    });

    return newData;
  },
  insert: function(data, fileName) {
    const curData = this.read(fileName);
    const ticket = new Array(data.ticket) || null;

    curData.data.push(data);
    this.write(curData, fileName, "insert", 1, ticket);
  },
  replace: function(fileName, filter, target, flag) {
    // Replace can only take one filter parameter.
    const curData = this.read(fileName);
    const targetKeyArr = [];
    const targetValueArr = [];
    const modifiedTicket = [];
    const mods = [];
    // Used to display or hide console log in node. Doesn't display logs if there's no change.
    let modStatus = "silent";

    targetArr = target.split(",");

    // Extract keys and values from filter array.
    filterKey = filter.split("|")[0];
    filterValue = filter.split("|")[1];

    targetArr.forEach(target => {
      targetKeyArr.push(target.split("|")[0]);
      targetValueArr.push(target.split("|")[1]);
    });

    curData.data.forEach((data, index) => {
      if (data[filterKey] && data[filterKey] === filterValue) {
        targetKeyArr.forEach((key, i) => {
          if (curData.data[index][key] != targetValueArr[i]) {
            modStatus = "show console log";
            mods.push(
              `${key}: ${curData.data[index][key]} => ${targetValueArr[i]}`
            );
          }
          curData.data[index][key] = targetValueArr[i];
        });
        modifiedTicket.push(curData.data[index][filterKey]);
      }
    });

    if (flag === "silent") modStatus = "silent";

    this.write(
      curData,
      fileName,
      "replace",
      1,
      modifiedTicket,
      mods,
      modStatus
    );
  },
  delete: function(fileName, filter, flag) {
    const curData = this.read(fileName);
    const keyArr = [];
    const valueArr = [];
    const removedTickets = [];

    if (!filter)
      throw new Error(
        `No filter specified when trying to delete from ${fileName}.json.`
      );

    let newData = curData;
    const filterArr = filter.split(",");

    // Extract keys and values from filter array.
    filterArr.forEach(filter => {
      keyArr.push(filter.split("|")[0]);
      valueArr.push(filter.split("|")[1]);
    });

    // Filter the new array with previously stored keys and values.
    newData.data = newData.data.filter((data, i) => {
      // Assume the entry in the DB is invalid.
      let isValid = flag === "matchall" ? false : true;

      keyArr.forEach((key, index) => {
        // Make it valid once it doesn't match one of the deletion filters.
        if (data[key] != valueArr[index] && flag === "matchall") isValid = true;
        else if (data[key] == valueArr[index] && flag !== "matchall")
          isValid = false;
      });
      // Add a new entry to removed tickets array.
      if (!isValid) removedTickets.push(curData.data[i].ticket);
      // Apply filter.
      return isValid;
    });

    this.write(newData, fileName, "delete", keyArr.length, removedTickets);
  },
  wipe: function(fileName) {
    const template = this.read(`templates/${fileName}.template`);
    this.write(template, fileName);
  },
  getOne: function(fileName, filter) {
    const curData = this.read(fileName);
    const valueArr = [];

    curData.data.forEach(data => {
      filter === "ticket"
        ? valueArr.push(data[filter])
        : valueArr.push(`${data.ticket}:${data[filter]}`);
    });

    if (valueArr.length === 0) return 0;
    return valueArr;
  }
};

const getDateNow = () => {
  return Date()
    .toString()
    .split("GMT")[0]
    .trim();
};

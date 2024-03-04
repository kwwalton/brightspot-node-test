const express = require("express");
const https = require("https");
const axios = require("axios");
const app = express();
const port = 3000;
// For the html page in the browser
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.listen(port, () => {
  console.log(`Listening to port ${port}...`);
});

const bsApiKey = process.env.BS_API_KEY;
const bsAuth = process.env.BS_AUTH;

// Shared between axios and https examples
const deliveryServiceQuery = `query {
    DeliveryServiceListConfiguration(id: "0000018d-f360-d959-a1ed-ffe4d4140000") {
      deliveryServices {
        active
        callOrTextMessage
        defaultStateWithDeliveryExpanded
        defaultStateWithWillCallExpanded
        descriptionHyperlink
        descriptionMessage
        displayServiceSku
        multipleMessagesBasedOnState {
          state
          message
        }
        recommended
        serviceName
        serviceSku
        switchableServiceIds
        warningMessage
        willCallMessage
        willCallTitle
      }
    }
  }`;

// For calling BrightSpot CMS from the server as from the client (browser) you will get CORS errors.
// This example uses https which requires wrapping https in a promise, compare this with axios example.
app.get("/bs-test", async (req, res) => {
  async function getBs() {
    let promise = new Promise((resolve, reject) => {
      const postBody = JSON.stringify({ query: deliveryServiceQuery });
      const options = {
        hostname: "cms.mfirm-uat.lower.k2.m1.brightspot.cloud",
        path: "/graphql/delivery/poc",
        port: 443,
        method: "POST",
        headers: {
          Authorization: `Basic ${bsAuth}`,
          "X-API-Key": `${bsApiKey}`,
        },
      };
      const req = https
        .request(options, (res) => {
          let data = [];
          const headerDate =
            res.headers && res.headers.date
              ? res.headers.date
              : "no response date";
          console.log("Status Code:", res.statusCode);
          console.log("Date in Response header:", headerDate);
          res.on("data", (chunk) => {
            console.log("got some data");
            data.push(chunk);
          });

          res.on("end", () => {
            console.log("Response ended: ");
            const bs = JSON.parse(Buffer.concat(data).toString());

            console.log("data", data, "bs", bs);
            // will return the data
            resolve(bs);
          });
        })
        .on("error", (err) => {
          console.log("Error: ", err.message);
          reject(err);
        });

      req.write(postBody);
      req.end();
    });

    let result = await promise;
    return result;
  }
  const bs = await getBs();
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(bs));
});

// BS using Axios
app.get("/bs-axios", async (req, res) => {
  const brightspotResponse = await axios.post(
    "https://cms.mfirm-uat.lower.k2.m1.brightspot.cloud/graphql/delivery/poc",
    JSON.stringify({ query: deliveryServiceQuery }),
    {
      headers: {
        Authorization: `Basic ${bsAuth}`,
        "X-API-Key": `${bsApiKey}`,
        "content-type": "application/json",
      },
    }
  );
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(brightspotResponse.data));
});

// JSON Typicode
app.get("/json-typicode", async (req, res) => {
  async function getUsers() {
    let promise = new Promise((resolve, reject) => {
      https
        .get("https://jsonplaceholder.typicode.com/users", (res) => {
          let data = [];
          const headerDate =
            res.headers && res.headers.date
              ? res.headers.date
              : "no response date";
          console.log("Status Code:", res.statusCode);
          console.log("Date in Response header:", headerDate);

          res.on("data", (chunk) => {
            data.push(chunk);
          });

          res.on("end", () => {
            console.log("Response ended: ");
            const users = JSON.parse(Buffer.concat(data).toString());

            for (user of users) {
              console.log(`Got user with id: ${user.id}, name: ${user.name}`);
            }
            // will return the data
            resolve(users);
          });
        })
        .on("error", (err) => {
          console.log("Error: ", err.message);
          reject(err);
        });
    });
    let result = await promise;
    return result;
  }
  const users = await getUsers();
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(users));
});

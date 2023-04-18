const asyncHandler = require("express-async-handler");
const https = require("https");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const predict = asyncHandler(async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    res.status(400);
    throw new Error("Please type a stock ticker");
  }

  const fileName = `StockPriceHistory-${ticker}.csv`;
  const stockHistory = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${process.env.ALPHA_API_KEY}`;

  if (!fs.existsSync(fileName)) {
    https.get(stockHistory, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const jsonData = JSON.parse(data)["Time Series (Daily)"];
        const rows = [];
        for (let [key, val] of Object.entries(jsonData)) {
          const date = new Date(key);
          const data_row = {
            Date: date.toISOString().slice(0, 10),
            Low: parseFloat(val["3. low"]),
            High: parseFloat(val["2. high"]),
            Close: parseFloat(val["4. close"]),
            Open: parseFloat(val["1. open"]),
          };
          rows.unshift(data_row);
        }
        const csvWriter = createCsvWriter({
          path: fileName,
          header: [
            { id: "Date", title: "Date" },
            { id: "Low", title: "Low" },
            { id: "High", title: "High" },
            { id: "Close", title: "Close" },
            { id: "Open", title: "Open" },
          ],
        });
        csvWriter.writeRecords(rows).then(() => {
          console.log(`CSV file ${fileName} has been saved.`);
        });
      });
    });
  }
});

module.exports = {
  predict,
};

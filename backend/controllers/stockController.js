const asyncHandler = require("express-async-handler");
const https = require("https");
const { createObjectCsvWriter } = require("csv-writer");

const predict = asyncHandler(async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    res.status(400);
    throw new Error("Please type a stock ticker");
  }

  try {
    const stockprices = await generateCsvFile(ticker);

    const stockpricesDict = {};
    stockprices.forEach((stock) => {
      stockpricesDict[stock.Date] = { Close: stock.Close };
    });

    const window_size = 20;

    const closePrices = stockprices.map((obj) => obj.Close);
    const dates = stockprices.map((obj) => obj.Date);

    const meanPrices = closePrices.map((price, index, array) => {
      if (index < window_size - 1) {
        return null;
      }
      const windowPrices = array.slice(index - window_size + 1, index + 1);
      const mean =
        windowPrices.reduce((sum, price) => sum + price, 0) / window_size;
      return mean.toFixed(2);
    });

    res.json({ ticker, dates, closePrices, meanPrices });
  } catch (err) {
    res.status(400);
    throw new Error("Ticker not found");
  }
});

const generateCsvFile = async (ticker) => {
  const fileName = `StockPriceHistory-${ticker}.csv`;
  const stockHistoryAPI = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${process.env.ALPHA_API_KEY}`;

  return new Promise((resolve, reject) => {
    https
      .get(stockHistoryAPI, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let jsonData = JSON.parse(data);
          if (
            res.statusCode !== 200 ||
            jsonData.hasOwnProperty("Error Message")
          ) {
            reject("Ticker not found");
          } else {
            jsonData = jsonData["Time Series (Daily)"];
            const rows = [];
            for (let [key, val] of Object.entries(jsonData)) {
              const date = new Date(key);
              const data_row = {
                Date: date.toISOString().slice(0, 10),
                Open: parseFloat(val["1. open"]),
                Low: parseFloat(val["3. low"]),
                High: parseFloat(val["2. high"]),
                Close: parseFloat(val["4. close"]),
              };
              rows.unshift(data_row);
            }
            rows.sort((a, b) => (a.Date < b.Date ? 1 : -1));
            const csvWriter = createObjectCsvWriter({
              path: fileName,
              header: [
                { id: "Date", title: "Date" },
                { id: "Open", title: "Open" },
                { id: "Low", title: "Low" },
                { id: "High", title: "High" },
                { id: "Close", title: "Close" },
              ],
            });
            csvWriter
              .writeRecords(rows)
              .then(() => {
                resolve(rows);
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      })
      .on("error", (err) => {
        console.log("Error getting stock prices: ", err);
        reject(err);
      });
  });
};

module.exports = {
  predict,
};

import axios from "axios";
import Plotly from "plotly.js-dist-min";

const API_URL = "/api/stock/";

const predict = async (ticker) => {
  const response = await axios
    .post(API_URL + "predict", ticker)
    .catch((error) => {
      console.log("axios error : ", error);
    });

  return response.data;
};

const buildGraph = (ticker, dates, closePrices, meanprices) => {
  const closeTrace = {
    x: dates,
    y: closePrices,
    type: "lines",
    name: "Close Price",
  };

  const meanTrace = {
    x: dates,
    y: meanprices,
    type: "lines",
    name: "Predicted Price",
    line: {
      dash: "dot",
    },
  };

  const data = [closeTrace, meanTrace];

  // Define Layout
  const layout = {
    title: ticker.toUpperCase(),
    xaxis: { title: "Date" },
    yaxis: { title: "Stock Price ($)" },
  };

  const config = {
    responsive: true,
  };

  Plotly.newPlot("plot", data, layout, config);
};

const stockService = {
  predict,
  buildGraph,
};

export default stockService;

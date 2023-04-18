import axios from "axios";

const API_URL = "/api/stock/";

const predict = async (ticker) => {
  const response = await axios.post(API_URL + "predict", ticker);

  if (response.data) {
    console.log(response.data);
  }

  return response.data;
};

const stockService = {
  predict,
};

export default stockService;

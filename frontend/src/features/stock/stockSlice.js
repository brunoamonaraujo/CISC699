import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import stockService from "./stockService";
import authSlice from "../auth/authSlice";

const initialState = {
  stock: { ticker: "" },
  ticker: "",
  setText: "",
};

export const predict = createAsyncThunk(
  "stock/predict",
  async (stock, thunkAPI) => {
    try {
      return await stockService.predict({ ticker: stock });
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const buildGraph = (ticker, dates, closePrices, meanprices) => {
  stockService.buildGraph(ticker, dates, closePrices, meanprices);
};

export const stockSlice = createSlice({
  name: "stock",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(predict.fulfilled, (state, action) => {
      state.stock = action.payload;
    });
    builder.addCase(buildGraph.fulfilled, (state, action) => {
      state.stock = action.payload;
    });
  },
});

export default authSlice.reducer;

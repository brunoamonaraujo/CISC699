import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { reset } from "../features/auth/authSlice";
import Spinner from "../components/Spinner";
import { predict } from "../features/stock/stockSlice";

function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, message } = useSelector(
    (state) => state.auth
  );

  var ticker = "AAPL";

  useEffect(() => {
    if (isError) {
      console.log(message);
    }

    if (!user) {
      navigate("/login");
    }

    dispatch(reset());
  }, [user, navigate, isError, message, dispatch]);

  if (isLoading) {
    return <Spinner />;
  }

  const handleInputChange = (event) => {
    ticker = event.target.value;
  };

  const handleClick = () => {
    try {
      dispatch(predict(ticker));
    } catch (error) {
      console.log("Error occurred:", error);
    }
  };

  return (
    <div>
      <section className="heading">
        <h1>Welcome {user && user.name}</h1>
      </section>
      <div className="stock-container">
        <input
          type="text"
          value={ticker}
          onChange={handleInputChange}
          className="text-input"
          placeholder="Ticker"
        />
        <button onClick={handleClick} className="btn">
          Predict
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

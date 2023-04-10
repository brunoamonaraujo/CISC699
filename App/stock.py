import neptune.new as neptune
import os
import tensorflow as tf 
import matplotlib.pyplot as plt
import pandas as pd
import datetime as dt
import urllib.request, json
import pandas as pd
import numpy as np

from datetime import date
from matplotlib import pyplot as plt
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from keras.models import Sequential, Model
from keras.models import Model
from keras.layers import Dense, Dropout, LSTM, Input, Activation, concatenate

myProject = 'brunoamonaraujo/StockPrediction'
project = neptune.init(api_token=os.getenv('NEPTUNE_API_TOKEN'),
                       project=myProject) 
project.stop()

os.chdir('C:/Users/bruno/OneDrive/Documents/HU/CISC 699/Final Project/CISC699/App')

api_key = os.getenv('ALPHA_API_KEY')
ticker = 'AAPL' 

url_string = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=%s&outputsize=full&apikey=%s"%(ticker,api_key)

fileName = 'stock_market_data-%s.csv'%ticker

### get the low, high, close, and open prices 
if not os.path.exists(fileName):
    with urllib.request.urlopen(url_string) as url:
        data = json.loads(url.read().decode())
        # pull stock market data
        data = data['Time Series (Daily)']
        df = pd.DataFrame(columns=['Date','Low','High','Close','Open'])
        for key,val in data.items():
            date = dt.datetime.strptime(key, '%Y-%m-%d')
            data_row = [date.date(),float(val['3. low']),float(val['2. high']),
                        float(val['4. close']),float(val['1. open'])]
            df.loc[-1,:] = data_row
            df.index = df.index + 1
    df.to_csv(fileName)

stockprices = df.sort_values('Date')

def calculate_rmse(y_true, y_pred):
    rmse = np.sqrt(np.mean((y_true-y_pred)**2))                   
    return rmse

def calculate_mape(y_true, y_pred): 
    y_pred, y_true = np.array(y_pred), np.array(y_true)    
    mape = np.mean(np.abs((y_true-y_pred) / y_true))*100    
    return mape

def extract_seqX_outcomeY(data, N, offset):
    X, y = [], []
    for i in range(offset, len(data)):
        X.append(data[i-N:i])
        y.append(data[i])
    return np.array(X), np.array(y)

test_ratio = 0.2
training_ratio = 1 - test_ratio

train_size = int(training_ratio * len(stockprices))
test_size = int(test_ratio * len(stockprices))

train = stockprices[:train_size][['Date', 'Close']]
test = stockprices[train_size:][['Date', 'Close']]

stockprices = stockprices.set_index('Date')

def plot_stock_trend(var, cur_title, stockprices=stockprices, logNeptune=True, logmodelName='Simple MA'):
    ax = stockprices[['Close', var,'200day']].plot(figsize=(20, 10))
    plt.grid(False)
    plt.title(cur_title)
    plt.axis('tight')
    plt.ylabel('Stock Price ($)')
    
    ## Log images to Neptune new version
    if logNeptune:
        npt_exp[f'Plot of Stock Predictions with {logmodelName}'].upload(neptune.types.File.as_image(ax.get_figure()))        
        
def calculate_perf_metrics(var, logNeptune=True, logmodelName='Simple MA'):
    ### RMSE 
    rmse = calculate_rmse(np.array(stockprices[train_size:]['Close']), np.array(stockprices[train_size:][var]))
    ### MAPE 
    mape = calculate_mape(np.array(stockprices[train_size:]['Close']), np.array(stockprices[train_size:][var]))
    
    ## Log images to Neptune new version
    if logNeptune:        
        # npt_exp.send_metric('RMSE', rmse)
        # npt_exp.log_metric('RMSE', rmse)
        # npt_exp['RMSE'] = rmse  ## 12-18
        npt_exp['RMSE'].log(rmse)
        
        # npt_exp.send_metric('MAPE (%)', mape)
        # npt_exp.log_metric('MAPE (%)', mape)
        npt_exp['MAPE (%)'].log(mape)  #### 12-18
    
    return rmse, mape

# 20 days to represent the 22 trading days in a month
window_size = 50

npt_exp = neptune.init(    
    api_token=os.getenv('NEPTUNE_API_TOKEN'),
    project=myProject, 
    name='EMA', 
    description='stock-prediction-machine-learning', 
    tags=['stockprediction', 'MA_Exponential', 'neptune'])       

window_var = str(window_size) + 'day'

###### Exponential MA
window_ema_var = window_var+'_EMA'
# Calculate the N-day exponentially weighted moving average
stockprices[window_ema_var] = stockprices['Close'].ewm(span=window_size, adjust=False).mean()
stockprices['200day'] = stockprices['Close'].rolling(200).mean()

### Plot and performance metrics for EMA model
plot_stock_trend(var=window_ema_var, cur_title='Exponential Moving Averages', logmodelName='Exp MA')
rmse_ema, mape_ema = calculate_perf_metrics(var=window_ema_var, logmodelName='Exp MA')
### Stop the run after logging for new version
npt_exp.stop()
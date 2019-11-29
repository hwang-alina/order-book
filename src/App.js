import React from "react";
import "./App.css";
import { Spin, Table, message } from "antd";
import axios from "axios";
import { parseData, updateArrAsc, updateArrDesc } from "./utils";

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ws: null,
      tableData: {},
      isFetching: false,
      error: null,
      data: null,
      messagesBuffer: [],
      firstProceedMsg: null
    };
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      this.state.tableData !== nextState.tableData ||
      this.state.error !== nextState.error
    );
  }

  componentDidMount() {
    let socket = new WebSocket(
      "wss://stream.binance.com/stream?streams=btcusdt@depth@100ms"
    );

    socket.onopen = () => {
      this.setState({ ws: socket });
      this.fetchData();
    };

    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      const isDataFetched = !this.state.isFetching && this.state.data !== null;
      const hasFirstProceedMsg = !!this.state.firstProceedMsg;

      this.saveMsgToBuffer(message.data);

      if (hasFirstProceedMsg) {
        this.removeRedundantBufferMsgs();
      }

      if (
        isDataFetched &&
        this.state.messagesBuffer.length &&
        this.state.messagesBuffer[this.state.messagesBuffer.length - 1].u >=
          this.state.data.lastUpdateId
      ) {
        const { messagesBuffer } = this.state;
        messagesBuffer.forEach((m, i, buff) => {
          if (
            isDataFetched &&
            m.U <= this.state.data.lastUpdateId + 1 &&
            m.u >= this.state.data.lastUpdateId + 1
          ) {
            this.setState({
              data: {
                ...this.state.data,
                lastUpdateId: m.u
              }
            });
            this.removeRedundantBufferMsgs();
            buff.forEach(m => this.updateTable(m));
          }
        });
      } else if (
        isDataFetched &&
        message.data.U <= this.state.data.lastUpdateId + 1 &&
        message.data.u >= this.state.data.lastUpdateId + 1
      ) {
        this.setState({
          data: {
            ...this.state.data,
            lastUpdateId: message.data.u
          },
          firstProceedMsg: message.data.u
        });
        this.removeRedundantBufferMsgs();
        this.updateTable(message.data);
      }
    };

    socket.onclose = () => {
      console.log("connection closed");
    };

    socket.onerror = error => {
      console.error(
        "Socket encountered error: ",
        error.message,
        "Closing socket"
      );
      message.error("Closing socket");
      socket.close();
    };
  }

  updateTable(msgData) {
    this.setState(prevState => ({
      data: {
        lastUpdateId: msgData.u,
        asks: updateArrAsc(prevState.data.asks, msgData.a),
        bids: updateArrDesc(prevState.data.bids, msgData.b)
      },
      tableData: {
        asks: parseData(prevState.data.asks.slice(0, 15)),
        bids: parseData(prevState.data.bids.slice(0, 15))
      }
    }));
    this.removeRedundantBufferMsgs();
  }

  saveMsgToBuffer(msgData) {
    this.setState(() => ({
      messagesBuffer: [...this.state.messagesBuffer, msgData]
    }));
  }

  removeRedundantBufferMsgs() {
    let filteredBuffer = this.state.messagesBuffer.slice();
    const result = filteredBuffer.filter(msg => {
      return msg.u >= this.state.data.lastUpdateId;
    });
    this.setState({ messagesBuffer: result });
  }

  fetchData() {
    const proxyURL = "https://cors-anywhere.herokuapp.com/";
    const URL =
      "https://www.binance.com/api/v3/depth?symbol=BTCUSDT&limit=1000";

    this.setState({ isFetching: true });
    axios
      .get(proxyURL + URL, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(res => {
        this.setState({
          data: res.data,
          tableData: {
            asks: parseData(res.data.asks.slice(0, 15)),
            bids: parseData(res.data.bids.slice(0, 15))
          },
          isFetching: false
        });
      })
      .catch(error => {
        console.error(error);
        this.setState({ error });
        this.state.ws.close();
        return null;
      });
  }

  componentWillUnmount() {
    this.state.ws.close();
  }

  render() {
    const columns = [
      {
        title: "Price (USDT)",
        dataIndex: "price",
        key: "price"
      },
      {
        title: "Amount (BTC)",
        dataIndex: "amount",
        key: "amount"
      },
      {
        title: "Total (USDT)",
        dataIndex: "total",
        key: "total"
      },
      {
        title: "Sum (USDT)",
        dataIndex: "sum",
        key: "sum"
      }
    ];

    const title = {
      buy: () => "Buy",
      sell: () => "Sell"
    };

    return (
      <div className="App">
        {this.state.data === null ? (
          this.state.error ? (
            <div className="error">Error: {this.state.error.message}</div>
          ) : (
            <Spin tip="Loading..." size="large" />
          )
        ) : (
          <div className="tables">
            <Table
              showHeader
              title={title.buy}
              className="table"
              dataSource={this.state.tableData.bids}
              columns={columns}
              pagination={false}
            />
            <Table
              showHeader
              title={title.sell}
              className="table"
              dataSource={this.state.tableData.asks}
              columns={columns}
              pagination={false}
            />
          </div>
        )}
      </div>
    );
  }
}

export default App;

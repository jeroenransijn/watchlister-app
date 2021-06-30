import "./styles.css";

const React = require("react");
const {
  Checkbox,
  Pane,
  Spinner,
  Link,
  Paragraph,
  Alert,
  Heading,
  Button,
  TextInputField
} = require("evergreen-ui");

const h = React.createElement;

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export default function App() {
  const [url, setURL] = React.useState("");
  const [tickers, setTickers] = React.useState([]);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isGroupedBySector, setIsGroupedBySector] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const isValidURL = url.indexOf("https://finviz.com/screener.ashx") === 0;

  function _onGetWatchlist() {
    setTickers([]);
    setIsFetching(true);
    fetch("https://watchlister-functions.netlify.app/.netlify/functions/main", {
      method: "POST", // *GET, POST, PUT, DELETE, etc.

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({ url }) // body data type must match "Content-Type" header
    })
      .then((res) => res.json())
      .then((data) => {
        setTickers(data.tickers);
      })
      .catch((err) => {
        console.error(err);
        setHasError(true);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }

  let outputList = [];
  const symbolsBySector = {};
  for (const { symbol, sector, href } of tickers) {
    if (!symbolsBySector[sector]) {
      symbolsBySector[sector] = [];
    }
    symbolsBySector[sector].push({ symbol, href });
  }
  if (isGroupedBySector && tickers.length) {
    for (const [sector, tickersBySector] of Object.entries(symbolsBySector)) {
      outputList.push(`###${sector}`);
      outputList = [...outputList, ...tickersBySector.map((x) => x.symbol)];
    }
  } else {
    outputList = tickers.map((x) => x.symbol);
  }

  function onDownload() {
    download(`Watchlist (${tickers.length} tickers)`, outputList.join(", "));
  }

  return h(Pane, { padding: 32, marginX: "auto", maxWidth: 760 }, [
    h(Pane, { key: "top", borderBottom: "default", marginBottom: 24 }, [
      h(Heading, { key: "heading", size: 900, marginBottom: 8 }, "Watchlister"),
      h(
        Paragraph,
        {
          key: "p",
          marginBottom: 24
        },
        [
          "This tool allows you to scrape tickers from the ",
          h(
            Link,
            {
              key: "link",
              target: "_blank",
              href: "https://finviz.com/screener.ashx"
            },
            "FinViz screener"
          ),
          " and download it as a TradingView watchlist. This tool will only scrape up to 10 pages."
        ]
      )
    ]),
    h(TextInputField, {
      value: url,
      onChange: (e) => setURL(e.target.value),
      label: "FinViz screener URL",
      hint:
        "Copy the URL from the screener page on FinViz. The URL should include the base url.",
      placeholder:
        "https://finviz.com/screener.ashx?v=151&f=fa_pb_low,fa_pc_low,fa_pe_u10&ft=4"
    }),
    isValidURL
      ? h(
          Button,
          {
            appearance: "primary",
            onClick: _onGetWatchlist,
            disabled: isFetching
          },
          "Get watchlist"
        )
      : h(Alert, {
          intent: "warning",
          title: "Enter a valid FinViz screener URL."
        }),
    hasError &&
      h(Alert, {
        marginTop: 32,
        intent: "danger",
        title: "Something went wrong."
      }),
    isFetching && h(Spinner, { marginTop: 40 }),
    tickers.length > 0 &&
      h(
        Pane,
        {
          marginTop: 32,
          background: "tint1",
          padding: 24
        },
        [
          h(Heading, { key: "h" }, `Watchlist (${tickers.length})`),
          h(Checkbox, {
            key: "checkbox",
            label: "Group by sector",
            checked: isGroupedBySector,
            onChange: (e) => setIsGroupedBySector(e.target.checked)
          }),
          isGroupedBySector
            ? Object.entries(symbolsBySector).map(([key, tickersBySector]) => {
                return h(Pane, { key, marginBottom: 16 }, [
                  h(Heading, { size: 300 }, key),
                  tickersBySector.map((ticker, index) => {
                    return h(
                      React.Fragment,
                      { key: ticker.symbol },
                      h(
                        Link,
                        {
                          target: "_blank",
                          href: ticker.href
                        },
                        ticker.symbol
                      ),
                      tickersBySector.length === index + 1 ? null : ", "
                    );
                  })
                ]);
              })
            : h(
                Paragraph,
                { marginTop: 16 },
                tickers.map((ticker, index) => {
                  return h(
                    React.Fragment,
                    { key: ticker.symbol },
                    h(
                      Link,
                      {
                        target: "_blank",
                        href: ticker.href
                      },
                      ticker.symbol
                    ),
                    tickers.length === index + 1 ? null : ", "
                  );
                })
              ),

          h(
            Button,
            { onClick: onDownload, marginTop: 32 },
            "Download TradingView watchlist"
          )
        ]
      )
  ]);
}

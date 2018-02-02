import React, { Component, Fragment } from 'react';

const sortLowestPriceFirst = ({ ASIN: an, OfferSummary: a }, { ASIN: bn, OfferSummary: b }) => {
  const a1 = (a.LowestUsedPrice && parseInt(a.LowestUsedPrice.Amount, 10)) || an;
  const b1 = (b.LowestUsedPrice && parseInt(b.LowestUsedPrice.Amount, 10)) || bn;
  return a1 - b1;
};

export default class App extends Component {
  state = {
    storage: [],
    results: [],
  };

  componentDidMount() {
    this.readStorage();
  }

  readStorage = () => {
    let storage = localStorage.getItem('books');
    if (storage) {
      storage = JSON.parse(storage);
      storage.sort(sortLowestPriceFirst);
      this.setState({ storage });
    }
  };

  saveItem = item => {
    let items = localStorage.getItem('books');
    if (items) {
      items = JSON.parse(items);
    } else {
      items = [];
    }
    items.push(item);
    localStorage.setItem('books', JSON.stringify(items));
    this.readStorage();
  };

  removeItem = ASIN => {
    let items = localStorage.getItem('books');
    if (items) {
      items = JSON.parse(items);
      const i = items.findIndex(item => item.ASIN === ASIN);
      if (i > -1) {
        items.splice(i, 1);
        localStorage.setItem('books', JSON.stringify(items));
        this.readStorage();
      }
    }
  };

  onSubmit = e => {
    e.preventDefault();

    this.setState({ loading: true });

    fetch('http://localhost:3000/search', {
      method: 'POST',
      body: JSON.stringify({
        search: e.target.elements.search.value,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => response.json())
      .then(results => {
        results.sort(sortLowestPriceFirst);
        this.setState({ results, loading: false });
      })
      .catch(e => {
        console.log(e);
        this.setState({ results: [], loading: false });
      });
  };

  getTableRow(item, i, save) {
    const { ASIN, DetailPageURL, ItemAttributes: atts, OfferSummary: summary } = item;
    return (
      <tr key={`${ASIN}${atts.Title}`}>
        <td>
          <a href={DetailPageURL} target="_blank">
            {atts.Title}
          </a>
        </td>
        <td>{atts.Publisher ? atts.Publisher : null}</td>
        <td>{atts.ISBN ? atts.ISBN : null}</td>
        <td>{atts.UPC ? atts.UPC : null}</td>
        <td>{summary.LowestNewPrice ? summary.LowestNewPrice.FormattedPrice : null}</td>
        <td>{summary.LowestUsedPrice ? summary.LowestUsedPrice.FormattedPrice : null}</td>
        {save ? (
          <td>
            <a
              href={DetailPageURL}
              onClick={e => {
                e.preventDefault();
                this.saveItem(item);
              }}
            >
              Save
            </a>
          </td>
        ) : (
          <td>
            <a
              href={DetailPageURL}
              onClick={e => {
                e.preventDefault();
                this.removeItem(ASIN);
              }}
            >
              Remove
            </a>
          </td>
        )}
      </tr>
    );
  }

  getItemTable(results, save = true) {
    return (
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Publisher</th>
            <th>ISBN</th>
            <th>UPC</th>
            <th>New Price</th>
            <th>Used Price</th>
            {save && <th>Save Item</th>}
          </tr>
        </thead>
        <tbody>
          {results.length > 0 ? (
            results.map((item, i) => this.getTableRow(item, i, save))
          ) : (
            <tr>
              <td colSpan={save ? 7 : 6}>No results</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  render() {
    return (
      <Fragment>
        <h1>Search Amazon</h1>
        <form action="/search" method="post" onSubmit={this.onSubmit}>
          <input type="text" name="search" disabled={this.state.loading} />
        </form>
        <h3>Search Results</h3>
        {this.state.loading ? <p>Loading...</p> : this.getItemTable(this.state.results, true)}
        <h3>Saved Items</h3>
        {this.getItemTable(this.state.storage, false)}
      </Fragment>
    );
  }
}

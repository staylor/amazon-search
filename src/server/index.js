import 'dotenv/config';
import React from 'react';
import { renderToString } from 'react-dom/server';
import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { OperationHelper } from 'apac';
import App from 'components/App';

const assets = require(KYT.ASSETS_MANIFEST); // eslint-disable-line import/no-dynamic-require

const app = express();
app.use(morgan('combined'));

const opHelper = new OperationHelper({
  awsId: process.env.AWS_ACCESS_ID,
  awsSecret: process.env.AWS_SECRET_KEY,
  assocId: process.env.AWS_ASSOC_ID,
  maxRequestsPerSecond: 1,
});

const searchPage = (Keywords, ItemPage = 1) => {
  console.log('Searching: ', Keywords, ItemPage);
  return opHelper.execute('ItemSearch', {
    Keywords,
    ItemPage,
    SearchIndex: 'Books',
    ResponseGroup: 'ItemAttributes,OfferSummary',
  });
};

app.post('/search', bodyParser.json(), async (req, res) => {
  const { search } = req.body;

  try {
    const { result: { ItemSearchResponse: { Items: data } } } = await searchPage(search);
    let response = data.Item;
    if (parseInt(data.TotalPages, 10) > 1) {
      for (let i = 2; i <= Math.min(10, data.TotalPages); i += 1) {
        const { result: { ItemSearchResponse: { Items } } } = await searchPage(search, i);
        response = response.concat(Items.Item);
      }
    }

    res.json(
      response.filter(r => r.ItemAttributes.Binding && r.ItemAttributes.Binding === 'Paperback')
    );
  } catch (e) {
    res.send(e);
  }
});

app.use((req, res) => {
  res.status(200);
  res.send(`<!doctype html>
  <html>
  <head>
    <title>Amazon Search</title>
    <style>
      body {font-family: sans-serif; font-size: 14px}
      table {border-collapse: collapse; margin: 20px 0; width: 1100px; max-width: 100%;}
      td {padding: 5px; border: 1px solid #ddd;}
      th {text-align: left;}
      input[type="text"] {
        border: 1px solid #ddd;
        padding: 3px;
        font-size: 16px;
        line-height: 1.4;
        display: block;
        width: 400px;
      }
    </style>
  </head>
  <body>
    <div id="app">${renderToString(<App />)}</div>
    ${assets['manifest.js'] ? `<script defer src="${assets['manifest.js']}"></script>` : ''}
    ${assets['vendor.js'] ? `<script defer src="${assets['vendor.js']}"></script>` : ''}
    ${assets['main.js'] ? `<script defer src="${assets['main.js']}"></script>` : ''}
  </body>
  </html>`);
});

app.listen(3000, () => console.log('Listening on port 3000'));

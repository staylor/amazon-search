const minimist = require('minimist');
const amazon = require('amazon-product-api');

const args = minimist(process.argv.slice(2));

const client = amazon.createClient({
  awsId: 'AKIAITWYMCHZZVP3X3LA',
  awsSecret: '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',
  awsTag: 'highforthis-20',
});

if (!args.search) {
  throw new Error('No Search Term specified via --search');
}

client
  .itemSearch({
    keywords: args.search,
    searchIndex: 'Books',
    responseGroup: 'ItemAttributes,OfferSummary',
  })
  .then(function(results) {
    const offerData = results.map(({ ItemAttributes, OfferSummary }) => ({
      ItemAttributes,
      OfferSummary,
    }));

    offerData.forEach(({ ItemAttributes, OfferSummary }) => {
      OfferSummary.forEach(({ LowestUsedPrice }) => {
        if (!LowestUsedPrice) {
          return;
        }

        console.log('============');
        console.log(`Title: ${ItemAttributes[0].Title.join(' | ')}`);
        ItemAttributes[0].Publisher &&
          console.log(`Publisher: ${ItemAttributes[0].Publisher.join(' | ')}`);
        ItemAttributes[0].ISBN && console.log(`ISBN: ${ItemAttributes[0].ISBN.join(' | ')}`);
        LowestUsedPrice &&
          console.log(`Lowest Used Price: ${LowestUsedPrice[0].FormattedPrice.join(' | ')}`);
      });
    });
  })
  .catch(function(err) {
    console.log(err);
  });

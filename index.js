require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('dns');
const { resolve } = require('path');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

let shorturlDB = [{
  original_url: '',
  short_url: ''
}]


function getShortNum(max) {
  let number = Math.floor(Math.random() * max)
  while (shorturlDB.find(d => d.short_url === number)) {
    number++
  }
  return number;
}
function checkInput(link, res, callback) {
  if (!/http.*:\/\//.test(link)) {
    console.log("link not containing https:// : ", link);
    callback(new Error('invalid url format'));
    return;
  }

  // Ignore the error (if any)
  dns.lookup(link.match(/.*:\/\/(.*)/)[1], (err, address, family) => {
    callback(null); // Proceed with storing the URL (ignoring error)
  });
}

app.post('/api/shorturl', function (req, res) {
  checkInput(req.body.url, res, (error) => {
    if (error) {
      console.error("Error checking input:", error);
      res.json({ error: 'invalid url' }); // Send an error response
    } else {
      // Only store the URL if the DNS lookup succeeded (ignored here)
      let short = getShortNum(200)
      shorturlDB.push({
        original_url: req.body.url,
        short_url: short
      });
      console.log("ADDED new data do DB:", shorturlDB);
      res.json({original_url: req.body.url,
        short_url: short})
    }
  });
})

app.get('/api/shorturl/:param', function (req, res) {
  if (!req.params.param) {
    // Handle missing parameter (e.g., send error or redirect)
    console.error("Missing parameter in request");
    return res.json({ error: "Invalid short URL" });
  }

  const shortUrl = Number(req.params.param);
  const foundUrl = shorturlDB.find(d => d.short_url === shortUrl);
  if (foundUrl) {
    console.log("Trying to redirect: ", shortUrl, " to: ", foundUrl.original_url);
    res.redirect(foundUrl.original_url);
    console.log("Redirect completed");
  } else {
    // No matching URL found, handle error (e.g., send error message)
    console.error("No matching URL found for short URL:", shortUrl);
    res.json({ error: "Invalid short URL" });
  }
})

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

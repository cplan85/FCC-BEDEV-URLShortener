require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const urlparser = require('url');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basic Configuration
const port = process.env.PORT || 3000;

const shortenedUrlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
  },
});

shortenedUrlSchema.plugin(AutoIncrement, { inc_field: 'short_url' });

const ShortenedUrl = mongoose.model('ShortenedUrl', shortenedUrlSchema);


app.use(cors());

let urlNumber = 1;
let urls = [];

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use("/api/shorturl", bodyParser.urlencoded({extended: false}));

app.route('/api/shorturl')

.post((req, res) => {
    const url = req.body.url;
    dns.lookup(urlparser.parse(url).hostname, (err, address, family) => {
      //console.log(dns.lookup(), "URL")
      if(!address) {
        res.json({ error: 'invalid url' })
      }
      else {
        const newUrl = new ShortenedUrl({original_url: url });

        newUrl.save()
        .then(doc => {
          console.log('Shortened URL created:', doc);
          res.json(doc);
        })
        .catch(err => {
          console.error('Error creating shortened URL:', err);
        });

      }
    
    })
})

app.route('/api/shorturl/:shorturl')
.get((req, res) => {
  const shortURL = req.params.shorturl;

  ShortenedUrl.findOne({short_url: shortURL})
  .then((doc) => {
    res.redirect(doc.original_url);
  })
  .catch((err) => {
    console.error(err);
  });

})
 

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

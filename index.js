const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { URL } = require('url');
require('dotenv').config({path: __dirname+"/keys.env"});

const uri = process.env["URI"];

mongoose.connect(uri).then(() => {
  console.log("Conexión exitosa a MongoDB");
})
  .catch(() => {
    console.log("Error al conectar a MongoDB");
  });

const Schema = mongoose.Schema;
const webSchema = new Schema({
  "original_url": String,
  "short_url": String
})
const Web = mongoose.model("Web", webSchema);

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));



app.get('/', function(req, res) {


  res.sendFile(process.cwd() + '/views/index.html');
});



async function validateUrl(urlString) {

  let url = recortarUrl(urlString);

  return new Promise((resolve, reject) => {

    dns.lookup(url, (err, address, family) => {
      if (err) {
        resolve(false)

      } else {
        resolve(true)
      }


    });
  })


}


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


async function getWeb(shortUrlValue) {

  let webFound = null;

  try {
    webFound = await Web.findOne({ short_url: shortUrlValue });

  } catch {
    console.log("Error al buscar una web");
  }

  return webFound

}

async function saveWebToMongo(web) {

  try {
    const newWeb = new Web(web);
    const savedWeb = await newWeb.save();
    return savedWeb;

  } catch {
    console.log("Error al guardar datos");
  }

}

app.post("/api/shorturl/", (req, res) => {

  console.log(req.body.url);
  const original_url = req.body.url;
  const short_url = getRandomInt(500);

  const web = {
    "original_url": original_url,
    "short_url": short_url
  }


  validateUrl(original_url).then((response) => {

    if (response) {

      saveWebToMongo(web).then((data) => {

        console.log(data.original_url + "-> Saved");
        const json = {
          "original_url": data.original_url,
          "short_url": data.short_url
        }
        res.json(json);

      })

    } else {
      res.json({ error: "invalid url" });
      console.log("URL INVALIDA");
    }

  })



});


app.get("/api/shorturl/:short_url", (req, res) => {

  const short_url = req.params.short_url;

  getWeb(short_url).then((data) => {

    res.redirect(data.original_url);
  })
    .catch(() => {
      res.send("Pagina no encontrada");
    })


})

function recortarUrl(urlString) {

  const url = new URL(urlString);
  const hostname = url.hostname;

  return hostname;

}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
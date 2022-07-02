const config = require("./config.json");

//const mysql = require("mysql");
//const con = mysql.createConnection(config.database);

var cors = require('cors')

const express = require("express");
const app = express();

const nodemailer = require("nodemailer");
const multiparty = require("multiparty");

const mustacheExpress = require("mustache-express");

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

app.use(express.json());
app.use(cors(corsOptions));

var corsOptions = {
  origin: 'http://localhost',
  optionsSuccessStatus: 200
}

const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 25,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
});

app.get("/", function (req, res) {
    res.render("index", { pageTitle: "Home" });
});

app.get("/learn", function (req, res) {
    res.render("learn/index", { pageTitle: "Learn Cloudic" });
});

app.get("/learn/alphabet", function (req, res) {
  res.render("learn/alphabet", { pageTitle: "Alphabet • Learn Cloudic" });
});

app.get("/translate", function (req, res) {
  res.render("tools/translate", { pageTitle: "Translate" });
});

app.use("/cdn", express.static("content"));
app.use("/cdn/bootstrap", express.static("node_modules/bootstrap/dist"));

app.use('/api', require('./routes/api'));

app.get('*', function(req, res){
    res.status(404).send('what???');
});

app.listen(config.port, () => {
    console.log(`Ready.`);
});

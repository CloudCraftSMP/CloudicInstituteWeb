const config = require("./config.json");

//const mysql = require("mysql");
//const con = mysql.createConnection(config.database);

const express = require("express");
const app = express();

const nodemailer = require("nodemailer");
const multiparty = require("multiparty");

const mustacheExpress = require("mustache-express");

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

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

app.post("/forms/sd01", function (req, res) {

    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    // prints date & time in YYYY-MM-DD format
    console.log(year + "-" + month + "-" + date);

  //1.
  let form = new multiparty.Form();
  let data = {};
  form.parse(req, function (err, fields) {
    console.log(fields);
    Object.keys(fields).forEach(function (property) {
      data[property] = fields[property].toString();
    });

    //2. You can configure the object however you want
    const mail = {
      from: 'Form Submissions <noreply@cloudcraft.fi>',
      to: 'overseers@cloudcraft.fi',
      cc: 'dandabs@cloudcraft.fi',
      subject: 'SD01: ' + data.minecraft,
      priority: 'high',
      text: `SD01 from ${data.minecraft} | ${data.discord}.
Primary election color: ${data.color}.
Primary election animal: ${data.animal}.
Primary flag(s): ${data.flag}.
Mother tongue: ${data.language}\n
Why do you want to become president?\n${data.whydoyouwant}.\n
What is an important issue on CC, and how would you propose to solve it?\n${data.importantissue}.\n
What's something you'd like to see implemented on CloudCraft?\n${data.newfeature}.\n
Form submitted at ${date + "/" + month + "/" + year}.`,
    };

    //3.
    transporter.sendMail(mail, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send("Something went wrong.");
      } else {
        //res.status(200).send("Email successfully sent to recipient!");
        res.render("forms/sd01-sent", { pageTitle: "Declaration of Intent (SD01)" });
      }
    });
  });
});

app.use("/cdn", express.static("content"));
app.use("/cdn/bootstrap", express.static("node_modules/bootstrap/dist"));

app.get('*', function(req, res){
    res.status(404).send('what???');
});

app.listen(config.port, () => {
    console.log(`Ready.`);
});

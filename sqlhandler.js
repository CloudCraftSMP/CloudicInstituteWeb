const exp = {};

const config = require("./config.json");

const mysql = require("mysql");

//Exp.con = mysql.createConnection(config.database);

exp.con = mysql.createPool(config.database);

exp.con.on('acquire', function (connection) {
    console.log('Connection %d acquired', connection.threadId);
});

exp.con.on('release', function (connection) {
    console.log('Connection %d released', connection.threadId);
});

module.exports = exp;

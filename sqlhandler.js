const exp = {};

const config = require("./config.json");

const mysql = require("mysql");
const MysqlCache = require('mysql-cache');

const LRU = require('lru-cache')

/*var Memento = require('memento-mysql');
var memcachedConfig = "127.0.0.1:11211";

exp.con = new Memento({
    mysql: config.database, 
    memcached: memcachedConfig
});*/

//Exp.con = mysql.createConnection(config.database);

//exp.con = mysql.createPool(config.database);

exp.con = new MysqlCache(config.database);

exp.con.connect(err => {
    if (err) {
        throw err // Catch any nasty errors!
    }
    console.log('W00t! i\'m connected!!')
 
    // Lets run some queries now!
})

/*exp.con.on('acquire', function (connection) {
    console.log('Connection %d acquired', connection.threadId);
});

exp.con.on('release', function (connection) {
    console.log('Connection %d released', connection.threadId);
});*/

module.exports = exp;

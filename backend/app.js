/* Environnement .env */
const dotenv = require("dotenv");
dotenv.config();

/* Useful constants */
module.exports.PORT = process.env.PORT || 8090;

/* Modules init */
module.exports.express = require('express');

const fs = require('fs');
module.exports.path = require('path');
module.exports.app = this.express();
module.exports.server = require('http').Server(this.app);
module.exports.io = require('socket.io')(this.server, {
    cors: {
        origin: '*',
        credentials: true
    }
});

this.server.listen(this.PORT, () => console.log(`[―――――START:${this.PORT}―――――]`));

/* Socket */
require('./src/socket.js');

module.exports.throttle = function(callback, delay) {
    var previousCall = new Date().getTime() - delay - 1;
    return function () {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}
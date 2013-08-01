/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */


console.log('I am a client with pid ' + process.pid);
var MessageClient = require('../lib/client');
var client = new MessageClient(5656, '127.0.0.1');
client.on('connect', function() {
    setInterval(function() {
        var data = {pid:process.pid, timestamp: new Date().getTime()};
        client.send(JSON.stringify(data));
    }, 5000);
});
client.on('message', function(msg) {
    console.log('server said: ' + msg);
});
client.connect();
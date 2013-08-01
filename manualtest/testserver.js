console.log('I am a server with pid ' + process.pid);
var MessageServer = require('../lib/server');
var server = new MessageServer(5656);
server.on('message', function(msg, client) {
    var data = JSON.parse(msg);
    console.log(msg);
    client.send('hey ' + data.pid + ', all looks good from ' + process.pid);
});
server.listen(function() {
    console.log('server is listening for incoming connections!');
});
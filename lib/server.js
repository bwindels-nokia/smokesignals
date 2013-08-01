/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */

var MessageClient = require('./client');
var net = require('net');
var EventEmitter = require('events').EventEmitter;

function MessageServer(pathOrPort) {
    if(typeof pathOrPort === 'number') {
        this.port = pathOrPort;
    } else if(typeof pathOrPort === 'string') {
        this.path = pathOrPort;
    }
    this.clients = [];
}

MessageServer.prototype = Object.create(EventEmitter.prototype);

MessageServer.prototype.listen = function(callback) {
    this.serverSocket = new net.Server();
    this.serverSocket.on('error', this.emit.bind(this,'error'));
    var self = this;
    this.serverSocket.on('connection', function(socket) {
        var client = new MessageClient();
        client.on('close', function() {
            var index = self.clients.indexOf(client);
            if(index!==-1) {
                self.clients.splice(index, 1);
            }
        });
        client.on('message', function(msg) {
            self.emit('message', msg, client);
        });
        client.on('error', self.emit.bind(self,'error'));
        
        client.setSocket(socket);
        self.clients.push(client);
    });
    if(this.path) {
        this.serverSocket.listen(this.path, callback);
    } else {
        this.serverSocket.listen(this.port, callback);
    }
};

MessageServer.prototype.close = function(callback) {
    if(this.serverSocket.listeners('close').length !== 0 || !this.serverSocket) {
        return;
    }
    
    this.clients.forEach(function(client) {
        client.close();
    });
    this.clients = [];
    
    var self = this;
    this.serverSocket.once('close', function() {
        self.serverSocket = null;
        if(callback) {
            callback();
        }
    });
    this.serverSocket.close();
};

module.exports = MessageServer;
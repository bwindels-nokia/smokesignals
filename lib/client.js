/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */

var net = require('net');
var EventEmitter = require('events').EventEmitter;
var Protocol = require('./protocol');

/** accepts path to unix socket or port and host */
function MessageClient(pathOrPort, host) {
    if(typeof pathOrPort === 'number') {
        this.port = pathOrPort;
    } else if(typeof pathOrPort === 'string') {
        this.path = pathOrPort;
    }
    this.host = host;
    this.protocol = new Protocol();
    this.protocol.on('message', this.emit.bind(this, 'message'));
}

MessageClient.prototype = Object.create(EventEmitter.prototype);

MessageClient.prototype.setSocket = function(socket) {
    this.socket = socket;
    this._initSocket();
    this.connected = true;
    this.socket.resume();
};

MessageClient.prototype._initSocket = function() {
    var self = this;
    var socket = this.socket;
    socket.on('error', this.emit.bind(this,'error'));
    socket.on('timeout', function() {self.emit('error', new Error('socket timed out'));});
    socket.on('connect', this.emit.bind(this,'connect'));
    socket.on('close', this.emit.bind(this,'close'));
    
    socket.on('connect', function() {
        self.connected = true;
        self.connecting = false;
        self.socket.resume();
    });
    socket.on('close', function() {
        self.connected = false;
        self.connecting = false;
    });
    socket.on('data', function(data) {
        self.protocol.decode(data);
    });
    return socket;
};

MessageClient.prototype.isUnixSocket = function() {
    return !!this.path;
};

MessageClient.prototype.connect = function() {
    if(this.connecting || this.connected) {
        return;
    }
    this.connecting = true;
    var socketType = this.isUnixSocket() ? 'unix' : 'tcp4';
    
    if(!this.socket) {
        this.socket = new net.Socket({type: socketType});
        this.socket = this._initSocket();
    }
    
    if(this.isUnixSocket()) {
        this.socket.connect(this.path);
    } else {
        this.socket.connect(this.port, this.host);
    }
};


MessageClient.prototype.send = function(message) {
    var bytes = this.protocol.encode(message);
    this.socket.write(bytes);
};

MessageClient.prototype.close = function() {
    if(this.socket) {
        this.socket.end();
        this.socket = null;
    }
};

module.exports = MessageClient;
/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */

var EventEmitter = require('events').EventEmitter;
var StringDecoder = require('string_decoder').StringDecoder;
var Buffers = require('./buffers');

function Protocol() {
    this.currentMessageSize = NaN;
    this.buffers = new Buffers();
    this.decoder = new StringDecoder('utf8');
}

Protocol.prototype = Object.create(EventEmitter.prototype);

Protocol.readInt32 = function(buffers) {
    var bytes = [];
    buffers.read(4, function(buf) {
        for(var i = 0; i < buf.length; ++i) {
            bytes.push(buf[i]);
        }
    });
    var i = bytes[0];
    i += ((bytes[1] & 0xff) << 8);
    i += ((bytes[2] & 0xff) << 16);
    i += ((bytes[3] & 0xff) << 24);
    return i;
};

Protocol.writeInt32 = function(buffer, n) {
    buffer[0] = n & 0xff;
    buffer[1] = ((n >> 8)  & 0xff );
    buffer[2] = ((n >> 16)  & 0xff );
    buffer[3] = ((n >> 24)  & 0xff );
};

Protocol.prototype.decode = function(buffer) {
    this.buffers.push(buffer);
    var lastError;
    var message = '';
    var self = this;
    
    function canReadSize() {
        return isNaN(self.currentMessageSize) && self.buffers.length() >= 4;
    }
    
    function canReadBody() {
        return !isNaN(self.currentMessageSize) && self.buffers.length() >= self.currentMessageSize;
    }
    
    function appendBuffer(buf) {
        var str = self.decoder.write(buf);
        message = message + str;
    }
    
    while(canReadSize() || canReadBody()) {
        if(canReadSize()) {
            this.currentMessageSize = Protocol.readInt32(this.buffers);
        }
        if(canReadBody()) {
            this.buffers.read(this.currentMessageSize, appendBuffer);
            
            try {
                this.emit('message', message);
            } catch(emitError) {
                lastError = emitError;
            }
            
            message = '';
            this.currentMessageSize = NaN;
        }
    }
    if(lastError) {
        throw lastError;
    }
};

Protocol.prototype.encode = function(message) {
    var messageBytes = new Buffer(message, 'utf8');
    var length = messageBytes.length;
    var completeBuffer = new Buffer(messageBytes.length + 4);
    Protocol.writeInt32(completeBuffer, length);
    messageBytes.copy(completeBuffer, 4);
    return completeBuffer;
};

module.exports = Protocol;
/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */

/* run with nodeunit test-buffers.js */

var Protocol = require('node_modules/smokesignals/lib/protocol');
var Buffers = require('node_modules/smokesignals/lib/buffers');
var testCase = require('nodeunit').testCase;

module.exports = testCase({
    "test read/write int32": function(test) {
        [4656232, 13, 157496, 56655, 1, 0, 3, 456, 157].forEach(function(i) {
            var b = new Buffer(4);
            Protocol.writeInt32(b, i);
            var bb = new Buffers();
            bb.push(b);
            var j = Protocol.readInt32(bb);
            test.equal(i,j,'encoded number should be equal to decoded number');
        });
        test.done();
    },
    "test protocol read/write": function(test) {
        test.expect(1);
        var sender = new Protocol();
        var receiver = new Protocol();
        receiver.on('message', function(message) {
            test.equal('hello', message, 'received message is incorrect');
        });
        var msg = sender.encode('hello');
        receiver.decode(msg);
        test.done();
    },
    "test encoding/decoding multiple messages as separate buffers": function(test) {
        var amount= 10;
        test.expect(amount);
        var sender = new Protocol();
        var receiver = new Protocol();
        var msgBody = 'this is a string that should be eighty one characters long in total, pretty cool!';
        receiver.on('message', function(message) {
            test.equal(msgBody, message, 'received message is incorrect');
        });
        for(var i = 0; i < amount; ++i) {
            var msg = sender.encode(msgBody);
            receiver.decode(msg);
        }
        test.done();
    },
    "test encoding/decoding multiple messages as one buffer": function(test) {
        var amount= 10;
        test.expect(amount);
        var sender = new Protocol();
        var receiver = new Protocol();
        var buffers = [];
        var msgBody = 'this is a string that should be eighty one characters long in total, pretty cool!';
        receiver.on('message', function(message) {
            test.equal(msgBody, message, 'received message is incorrect');
        });
        for(var i = 0; i < amount; ++i) {
            var msg = sender.encode(msgBody);
            buffers.push(msg);
        }
        var totalBytes = buffers.reduce(function(total, buffer) {
            return total + buffer.length;
        }, 0);
        var totalBuffer = new Buffer(totalBytes);
        buffers.reduce(function(lastOffset, buffer) {
            buffer.copy(totalBuffer, lastOffset);
            return lastOffset + buffer.length;
        }, 0);
        receiver.decode(totalBuffer);
        test.done();
    },
    "test throwing exception in message event handler does not brake stuff": function(test) {
        var sender = new Protocol();
        var receiver = new Protocol();
        var messages = ['hello! (world)', 'how are you doing today?', 'good, you?'];
        
        test.expect(1 + (messages.length * 2));
        
        var counter = 0;
        receiver.on('message', function(message) {
            var expectedMessage = messages[counter];
            ++counter;
            test.equal(expectedMessage, message, 'received message is incorrect');
            //throwing an error here should not break Protocol's internal state
            throw new Error('foo');
        });
        messages.forEach(function(message) {
            var msg = sender.encode(message);
            try {
                receiver.decode(msg);
            } catch(err) {
                test.equal(err.message, 'foo', 'foo error should be rethrown');
            }
        });
        test.equal(counter, messages.length, 'counter should have been increased in event callback');
        test.done();
    }
});
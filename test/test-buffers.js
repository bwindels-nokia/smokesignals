/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */

/* run with nodeunit test-buffers.js */

var Buffers = require('node_modules/smokesignals/lib/buffers');
var testCase = require('nodeunit').testCase;
var StringDecoder = require('string_decoder').StringDecoder;

module.exports = testCase({
    "test reading exact buffers" : function(test) {
        test.expect(5);
        var str1 = 'hèllo wörld';
        var str2 = '¡niño niño, qué haces?!';
        var buf1 = new Buffer(str1, 'utf8');
        var buf2 = new Buffer(str2, 'utf8');
        var buffers = new Buffers();
        buffers.push(buf1);
        buffers.push(buf2);
        test.equal(buffers.length(), buf1.length + buf2.length, 'length should be length of 2 remaining buffers');
        buffers.read(buf1.length, function(buf) {
            test.equal(str1, buf.toString('utf8'), 'str1 is not as expected');
        });
        test.equal(buffers.length(), buf2.length, 'length should be length of remaining buffer');
        buffers.read(buf2.length, function(buf) {
            test.equal(str2, buf.toString('utf8'), 'str2 is not as expected');
        });
        test.equal(buffers.length(), 0, 'buffers length should be 0 after consuming the two sub buffers');
        test.done();
    },
    "test read string spanning multiple buffers": function(test) {
        var buffers = new Buffers();
        buffers.push(new Buffer('hello ', 'utf8'));
        buffers.push(new Buffer('cruel ', 'utf8'));
        buffers.push(new Buffer('world! how ', 'utf8'));
        buffers.push(new Buffer('is it going?', 'utf8'));
        buffers.push(new Buffer(' you look tired, my pal', 'utf8'));

        var decoder = new StringDecoder('utf8');
        var str = '';
        buffers.read(18, function(buf) {
            str = str + decoder.write(buf);
        });
        test.equal('hello cruel world!', str, 'first string composed incorrectly from sub buffers');
        str = '';
        buffers.read(17, function(buf) {
            str = str + decoder.write(buf);
        });
        test.equal(' how is it going?', str, 'second string composed incorrectly from sub buffers');
        str = '';
        buffers.read(15, function(buf) {
            str = str + decoder.write(buf);
        });
        test.equal(' you look tired', str, 'third string composed incorrectly from sub buffers');
        test.equal(buffers.length(), 8, 'buffers length should be 8 for ", my pal" after reading strings');

        test.done();
    },
    "test reading partially from a buffer": function(test) {
        var buffers = new Buffers();
        buffers.push(new Buffer('hello world!', 'utf8'));
        buffers.read(6, function(buf) {
            test.equal('hello ', buf.toString('utf8'), 'first string is not as expected');
        });
        buffers.read(6, function(buf) {
            test.equal('world!', buf.toString('utf8'), 'second string is not as expected');
        });
        test.equal(buffers.length(), 0, 'buffers length should be 0 after consuming the two sub buffers');

        test.done();
    },
    "test reading over buffer boundaries": function(test) {
        var buffers = new Buffers();
        buffers.push(new Buffer('hello, big scary', 'utf8'));
        buffers.push(new Buffer(' world', 'utf8'));
        buffers.read(7, function(buf) {
            test.equal('hello, ', buf.toString('utf8'), 'first string is not as expected');
        });
        var decoder = new StringDecoder('utf8');
        var str = '';
        buffers.read(15, function(buf) {
            str = str + decoder.write(buf);
        });
        test.equal('big scary world', str, 'second string is not as expected');
        test.equal(buffers.length(), 0, 'buffers length should be 0 after consuming the two sub buffers');

        test.done();
    }
});



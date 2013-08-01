/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */

function Buffers() {
    this.buffers = [];
    this.len = 0;
    this.pos = 0;
}

Buffers.prototype = {
    push: function(buffer) {
        this.buffers.push(buffer);
        this.len += buffer.length;
    },
    read: function(length, callback) {
        if(this.length() < length) {
            throw new Error('not that many bytes available ('+length+')');
        }
        var bytesRead = 0;
        var lastError;
        while(bytesRead < length) {
            var buffer = this.buffers[0];
            var bytesToRead = Math.min(buffer.length - this.pos, length - bytesRead);
            try {
                callback(buffer.slice(this.pos, this.pos + bytesToRead));
            } catch(err) {
                lastError = err;
            }
            this.pos += bytesToRead;
            if(this.pos >= buffer.length) {
                this.len -= buffer.length;
                this.pos -= buffer.length;
                this.buffers.shift();
            }
            bytesRead += bytesToRead;
        }
        if(lastError) {
            throw lastError;
        }
    },
    length: function() {
        return this.len - this.pos;
    }
};

module.exports = Buffers;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Arena = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _malloc = require("malloc");

var _malloc2 = _interopRequireDefault(_malloc);

var _garbageCollector = require("garbage-collector");

var _garbageCollector2 = _interopRequireDefault(_garbageCollector);

var _arenaSources = require("./arena-sources");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Arenas represent the large, contiguous backing buffers which get persisted to disk.
 * Each arena can contain many blocks, but no block may be larger than the arena size.
 */

var Arena = exports.Arena = function () {

  /**
   * Initialize the arena.
   */

  function Arena(config) {
    (0, _classCallCheck3.default)(this, Arena);

    this.name = config.name;
    this.sequenceNumber = config.sequenceNumber;
    if (config.buffer instanceof Buffer) {
      var _buffer = config.buffer;
      this.buffer = _buffer.buffer;
      this.byteOffset = _buffer.byteOffset;
      this.byteLength = _buffer.length;
    } else if (config.buffer instanceof ArrayBuffer) {
      var _buffer2 = config.buffer;
      this.buffer = _buffer2;
      this.byteOffset = config.byteOffset || 0;
      this.byteLength = _buffer2.byteLength - this.byteOffset;
    } else {
      throw new TypeError("Arena buffer must be an instance of Buffer or ArrayBuffer.");
    }
    this.allocator = new _malloc2.default(this.buffer, this.byteOffset);

    this.startAddress = this.sequenceNumber * this.byteLength;
    this.gc = new _garbageCollector2.default(this.allocator, {
      lifetime: config.gc.lifetime,
      callbacks: config.gc.callbacks,
      callbackOffset: this.startAddress
    });
    this.dataView = new DataView(this.buffer, this.byteOffset);

    // create array types.
    this.int8Array = new Int8Array(this.buffer, this.byteOffset);
    this.uint8Array = new Uint8Array(this.buffer, this.byteOffset);
    this.int16Array = new Int16Array(this.buffer, this.byteOffset);
    this.uint16Array = new Uint16Array(this.buffer, this.byteOffset);
    this.int32Array = new Int32Array(this.buffer, this.byteOffset);
    this.uint32Array = new Uint32Array(this.buffer, this.byteOffset);
    this.float32Array = new Float32Array(this.buffer, this.byteOffset);
    this.float64Array = new Float64Array(this.buffer, this.byteOffset);
    this.doubleArray = new Float64Array(this.buffer, this.byteOffset);
  }

  /**
   * Allocate the given number of bytes from this arena and return the relative start offset,
   * or 0 if there is not enough space in the arena.
   */


  (0, _createClass3.default)(Arena, [{
    key: "alloc",
    value: function alloc(numberOfBytes) {
      trace: "Attempting to allocate " + numberOfBytes + " bytes from arena " + this.sequenceNumber + " (" + this.startAddress + ").";
      return this.allocator.alloc(numberOfBytes);
    }

    /**
     * Allocate and clear the given number of bytes from this arena and return the relative start offset,
     * or 0 if there is not enough space in the arena.
     */

  }, {
    key: "calloc",
    value: function calloc(numberOfBytes) {
      trace: "Attempting to allocate and clear " + numberOfBytes + " bytes from arena " + this.sequenceNumber + " (" + this.startAddress + ").";
      return this.allocator.calloc(numberOfBytes);
    }

    /**
     * Free a number of bytes from the given offset.
     */

  }, {
    key: "free",
    value: function free(offset) {
      trace: "Freeing offset " + offset + " from arena " + this.sequenceNumber + ".";
      return this.allocator.free(offset);
    }

    /**
     * Determine the size of the block at the given offset.
     */

  }, {
    key: "sizeOf",
    value: function sizeOf(offset) {
      trace: "Reading size of offset " + offset + " from arena " + this.sequenceNumber + ".";
      return this.allocator.sizeOf(offset);
    }
  }]);
  return Arena;
}();
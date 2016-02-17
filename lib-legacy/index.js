"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Backing = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _arena = require("./arena");

var _gc = require("./gc");

var _arrayBuffer = require("./arena-sources/array-buffer");

var _arrayBuffer2 = _interopRequireDefault(_arrayBuffer);

var _mmap = require("./arena-sources/mmap");

var _mmap2 = _interopRequireDefault(_mmap);

var _typeRegistry = require("type-registry");

var _typeRegistry2 = _interopRequireDefault(_typeRegistry);

var _arenaSources = require("./arena-sources");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HEADER_ADDRESS = 296;
var VERSION_ADDRESS = HEADER_ADDRESS;
var GC_BASE_ADDRESS = VERSION_ADDRESS + 8;
var HEADER_CHECKSUM_ADDRESS = GC_BASE_ADDRESS + 16;
var HEADER_SIZE = HEADER_CHECKSUM_ADDRESS + 8 - HEADER_ADDRESS;
var FIRST_ADDRESS = HEADER_ADDRESS + HEADER_SIZE;

var Backing = exports.Backing = function () {
  function Backing(options) {
    (0, _classCallCheck3.default)(this, Backing);

    trace: "Creating backing";
    this.name = options.name;
    this.arenas = [];
    this.arenaSize = options.arenaSize;
    this.registry = options.registry instanceof _typeRegistry2.default ? options.registry : new _typeRegistry2.default(options.registry);
    this.isInitialized = false;
    this.MIN_ALLOCATION_SIZE = 16;
    this.MAX_ALLOCATION_SIZE = this.arenaSize - (FIRST_ADDRESS + 16);
    this.arenaSource = this.createArenaSource(options.arenaSource);
  }

  /**
   * Get the maximum address in the store.
   */


  (0, _createClass3.default)(Backing, [{
    key: "init",


    /**
     * Initialize the backing store.
     */
    value: function init() {
      var _this2 = this;

      var _this = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                trace: "Initializing backing: " + _this.name + ".";

                if (!_this.isInitialized) {
                  _context.next = 3;
                  break;
                }

                throw new Error('Backing cannot be initialized twice.');

              case 3:
                _context.next = 5;
                return _this.arenaSource.init();

              case 5:
                verifyHeader(_this);
                _this.gc = new _gc.AggregateGarbageCollector(_this);

                _this.isInitialized = true;

                trace: "Finished initializing backing.";
                return _context.abrupt("return", _this);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, _this2);
      }))();
    }

    /**
     * Create the arena source for this backing store.
     */

  }, {
    key: "createArenaSource",
    value: function createArenaSource(config) {
      if (typeof config === 'function') {
        return config(this);
      } else if (config.type === 'mmap') {
        return new _mmap2.default(this, config);
      } else {
        return new _arrayBuffer2.default(this, config);
      }
    }

    /**
     * Compute the offset of the given address relative to its containing arena.
     */

  }, {
    key: "offsetFor",
    value: function offsetFor(address) {
      if (address > this.arenaSize) {
        return address % this.arenaSize;
      } else {
        return address;
      }
    }

    /**
     * Get the arena for the given address, or `undefined` if it does not exist.
     */

  }, {
    key: "arenaFor",
    value: function arenaFor(address) {
      if (address < 0 || address > this.maxAddress) {
        throw new RangeError("Cannot retreive arena at " + address + ", address is out of bounds.");
      }
      if (address < this.arenaSize) {
        return this.arenas[0];
      } else {
        return this.arenas[address / this.arenaSize >> 0];
      }
    }

    /**
     * Read an int8 at the given address.
     */

  }, {
    key: "getInt8",
    value: function getInt8(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].int8Array[address];
      } else {
        return this.arenas[address / this.arenaSize >> 0].int8Array[address % this.arenaSize];
      }
    }

    /**
     * Write an int8 at the given address.
     */

  }, {
    key: "setInt8",
    value: function setInt8(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].int8Array[address] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].int8Array[address % this.arenaSize] = value;
      }
    }

    /**
     * Read a uint8 at the given address.
     */

  }, {
    key: "getUint8",
    value: function getUint8(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].uint8Array[address];
      } else {
        return this.arenas[address / this.arenaSize >> 0].uint8Array[address % this.arenaSize];
      }
    }

    /**
     * Write a uint8 at the given address.
     */

  }, {
    key: "setUint8",
    value: function setUint8(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].uint8Array[address] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].uint8Array[address % this.arenaSize] = value;
      }
    }

    /**
     * Read an int16 at the given address.
     */

  }, {
    key: "getInt16",
    value: function getInt16(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].int16Array[address >> 1];
      } else {
        return this.arenas[address / this.arenaSize >> 0].int16Array[address % this.arenaSize >> 1];
      }
    }

    /**
     * Write an int16 at the given address.
     */

  }, {
    key: "setInt16",
    value: function setInt16(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].int16Array[address >> 1] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].int16Array[address % this.arenaSize >> 1] = value;
      }
    }

    /**
     * Read a uint16 at the given address.
     */

  }, {
    key: "getUint16",
    value: function getUint16(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].uint16Array[address >> 1];
      } else {
        return this.arenas[address / this.arenaSize >> 0].uint16Array[address % this.arenaSize >> 1];
      }
    }

    /**
     * Write a uint16 at the given address.
     */

  }, {
    key: "setUint16",
    value: function setUint16(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].uint16Array[address >> 1] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].uint16Array[address % this.arenaSize >> 1] = value;
      }
    }

    /**
     * Read an int32 at the given address.
     */

  }, {
    key: "getInt32",
    value: function getInt32(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].int32Array[address >> 2];
      } else {
        return this.arenas[address / this.arenaSize >> 0].int32Array[address % this.arenaSize >> 2];
      }
    }

    /**
     * Write an int32 at the given address.
     */

  }, {
    key: "setInt32",
    value: function setInt32(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].int32Array[address >> 2] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].int32Array[address % this.arenaSize >> 2] = value;
      }
    }

    /**
     * Read a uint32 at the given address.
     */

  }, {
    key: "getUint32",
    value: function getUint32(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].uint32Array[address >> 2];
      } else {
        return this.arenas[address / this.arenaSize >> 0].uint32Array[address % this.arenaSize >> 2];
      }
    }

    /**
     * Write a uint32 at the given address.
     */

  }, {
    key: "setUint32",
    value: function setUint32(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].uint32Array[address >> 2] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].uint32Array[address % this.arenaSize >> 2] = value;
      }
    }

    /**
     * Read a float32 at the given address.
     */

  }, {
    key: "getFloat32",
    value: function getFloat32(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].float32Array[address >> 2];
      } else {
        return this.arenas[address / this.arenaSize >> 0].float32Array[address % this.arenaSize >> 2];
      }
    }

    /**
     * Write a float32 at the given address.
     */

  }, {
    key: "setFloat32",
    value: function setFloat32(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].float32Array[address >> 2] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].float32Array[address % this.arenaSize >> 2] = value;
      }
    }

    /**
     * Read a float64 at the given address.
     */

  }, {
    key: "getFloat64",
    value: function getFloat64(address) {
      if (address < this.arenaSize) {
        return this.arenas[0].float64Array[address >> 3];
      } else {
        return this.arenas[address / this.arenaSize >> 0].float64Array[address % this.arenaSize >> 3];
      }
    }

    /**
     * Write a float64 at the given address.
     */

  }, {
    key: "setFloat64",
    value: function setFloat64(address, value) {
      if (address < this.arenaSize) {
        this.arenas[0].float64Array[address >> 3] = value;
      } else {
        this.arenas[address / this.arenaSize >> 0].float64Array[address % this.arenaSize >> 3] = value;
      }
    }

    /**
     * Align the given value to 8 bytes.
     */

  }, {
    key: "align",
    value: function align(value) {
      return value + 7 & ~7;
    }

    /**
     * Allocate the given number of bytes from the first arena which has enough space.
     * If no arenas have the capacity, a new arena will be created.
     */

  }, {
    key: "alloc",
    value: function alloc(numberOfBytes) {
      trace: "Allocating " + numberOfBytes + " bytes.";

      if (numberOfBytes < this.MIN_ALLOCATION_SIZE) {
        numberOfBytes = this.MIN_ALLOCATION_SIZE;
      } else if (numberOfBytes > this.MAX_ALLOCATION_SIZE) {
        throw new RangeError("Cannot allocate " + numberOfBytes + " bytes.");
      } else {
        numberOfBytes = this.align(numberOfBytes);
      }

      var arenas = this.arenas;

      for (var i = 0; i < arenas.length; i++) {
        var _offset = arenas[i].alloc(numberOfBytes);
        if (_offset !== 0) {
          return arenas[i].startAddress + _offset;
        }
      }

      var arena = this.arenaSource.createSync();

      var offset = arena.alloc(numberOfBytes);
      if (offset === 0) {
        throw new Error("Could not allocate " + numberOfBytes + " within new arena " + arena.sequenceNumber);
      }
      return arena.startAddress + offset;
    }

    /**
     * Allocate and clear the given number of bytes and return the address.
     */

  }, {
    key: "calloc",
    value: function calloc(numberOfBytes) {
      var address = this.alloc(numberOfBytes);
      if (address === 0) {
        return 0;
      }
      var arena = this.arenaFor(address);
      var uint32Array = arena.uint32Array;
      var offset = address - arena.startAddress >> 2;
      var max = Math.ceil(numberOfBytes >> 2);
      for (var i = 0; i < max; i++) {
        uint32Array[offset + i] = 0;
      }
      return address;
    }

    /**
     * Return the size of the block at the given address.
     */

  }, {
    key: "sizeOf",
    value: function sizeOf(address) {
      var arena = this.arenaFor(address);
      if (!arena) {
        return 0;
      }
      var offset = this.offsetFor(address);
      return arena.allocator.sizeOf(offset);
    }

    /**
     * Free the block at the given address and return the number of bytes which were freed.
     */

  }, {
    key: "free",
    value: function free(address) {
      trace: "Freeing address: " + address + ".";

      var arena = this.arenaFor(address);
      if (!arena) {
        throw new Error("Cannot free address " + address + ", no such arena.");
      }

      var offset = this.offsetFor(address);

      return arena.free(offset);
    }

    /**
     * Copy the given number of bytes from the source address to the given target address.
     */

  }, {
    key: "copy",
    value: function copy(targetAddress, sourceAddress, numberOfBytes) {
      var targetOffset = this.offsetFor(targetAddress);
      var targetArray = this.arenaFor(targetAddress).uint8Array;

      var sourceOffset = this.offsetFor(sourceAddress);
      var sourceArray = this.arenaFor(sourceAddress).uint8Array;

      for (var i = 0; i < numberOfBytes; i++) {
        targetArray[targetOffset + i] = sourceArray[sourceOffset + i];
      }

      return numberOfBytes;
    }
  }, {
    key: "maxAddress",
    get: function get() {
      return this.arenas.length * this.arenaSize;
    }
  }]);
  return Backing;
}();

function verifyHeader(backing) {
  var arena = backing.arenaFor(HEADER_ADDRESS);
  if (backing.getUint32(HEADER_ADDRESS) !== HEADER_ADDRESS || backing.getUint32(HEADER_CHECKSUM_ADDRESS) !== HEADER_CHECKSUM_ADDRESS) {
    var address = backing.calloc(HEADER_SIZE);
    if (address !== HEADER_ADDRESS) {
      throw new TypeError("Allocator returned an invalid backing header address.");
    }
    backing.setUint32(HEADER_ADDRESS, HEADER_ADDRESS);
    backing.setUint32(HEADER_CHECKSUM_ADDRESS, HEADER_CHECKSUM_ADDRESS);
  }
}
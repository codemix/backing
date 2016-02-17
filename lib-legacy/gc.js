"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AggregateGarbageCollector = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _arena = require("./arena");

var _typeRegistry = require("type-registry");

var _ = require("./");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AggregateGarbageCollector = exports.AggregateGarbageCollector = function () {

  /**
   * Initialize the garbage collector.
   */

  function AggregateGarbageCollector(backing) {
    (0, _classCallCheck3.default)(this, AggregateGarbageCollector);

    this.backing = backing;
    this.lastCycledIndex = -1;
  }

  /**
   * Align the given value to 8 bytes.
   */


  /**
   * The index of the last arena which received an incremental garbage collection cycle.
   */


  (0, _createClass3.default)(AggregateGarbageCollector, [{
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
      var typeId = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      trace: "Allocating " + numberOfBytes + " bytes.";
      var backing = this.backing;

      if (numberOfBytes < backing.MIN_ALLOCATION_SIZE) {
        numberOfBytes = backing.MIN_ALLOCATION_SIZE;
      } else if (numberOfBytes > backing.MAX_ALLOCATION_SIZE) {
        throw new RangeError("Cannot allocate " + numberOfBytes + " bytes.");
      } else {
        numberOfBytes = this.align(numberOfBytes);
      }

      var arenas = backing.arenas;

      for (var i = 0; i < arenas.length; i++) {
        var _offset = arenas[i].gc.alloc(numberOfBytes, typeId);
        if (_offset !== 0) {
          return arenas[i].startAddress + _offset;
        }
      }

      var arena = backing.arenaSource.createSync();

      var offset = arena.gc.alloc(numberOfBytes);
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
      var typeId = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      trace: "Allocating and clearing " + numberOfBytes + " bytes.";
      var backing = this.backing;

      if (numberOfBytes < backing.MIN_ALLOCATION_SIZE) {
        numberOfBytes = backing.MIN_ALLOCATION_SIZE;
      } else if (numberOfBytes > backing.MAX_ALLOCATION_SIZE) {
        throw new RangeError("Cannot allocate " + numberOfBytes + " bytes.");
      } else {
        numberOfBytes = this.align(numberOfBytes);
      }

      var arenas = backing.arenas;

      for (var i = 0; i < arenas.length; i++) {
        var _offset2 = arenas[i].gc.calloc(numberOfBytes, typeId);
        if (_offset2 !== 0) {
          return arenas[i].startAddress + _offset2;
        }
      }

      var arena = backing.arenaSource.createSync();

      var offset = arena.gc.calloc(numberOfBytes);
      if (offset === 0) {
        throw new Error("Could not allocate " + numberOfBytes + " within new arena " + arena.sequenceNumber + ".");
      }
      return arena.startAddress + offset;
    }

    /**
     * Return the size of the block at the given address.
     */

  }, {
    key: "sizeOf",
    value: function sizeOf(address) {
      var backing = this.backing;

      var arena = backing.arenaFor(address);
      if (!arena) {
        return 0;
      }
      var offset = backing.offsetFor(address);
      return arena.gc.sizeOf(offset);
    }

    /**
     * Returns the type of the block at the given address.
     */

  }, {
    key: "typeOf",
    value: function typeOf(address) {
      var backing = this.backing;

      var arena = backing.arenaFor(address);
      if (!arena) {
        return undefined;
      }
      var offset = backing.offsetFor(address);
      var typeId = arena.gc.typeOf(offset);
      if (typeId === 0) {
        return undefined;
      } else {
        return backing.registry.I[typeId];
      }
    }

    /**
     * Increment the reference count at the given address.
     */

  }, {
    key: "ref",
    value: function ref(address) {
      var backing = this.backing;

      var arena = backing.arenaFor(address);
      if (!arena) {
        return 0;
      }
      var offset = backing.offsetFor(address);
      return arena.gc.ref(offset);
    }

    /**
     * Decrement the reference count at the given address.
     */

  }, {
    key: "unref",
    value: function unref(address) {
      var backing = this.backing;

      var arena = backing.arenaFor(address);
      if (!arena) {
        return 0;
      }
      var offset = backing.offsetFor(address);
      return arena.gc.unref(offset);
    }

    /**
     * Free the block at the given address (assuming its reference count is zero)
     * and return the number of bytes which were freed.
     */

  }, {
    key: "free",
    value: function free(address) {
      trace: "Freeing address: " + address + ".";
      var backing = this.backing;

      var arena = backing.arenaFor(address);
      if (!arena) {
        throw new Error("Cannot free address " + address + ", no such arena.");
      }

      var offset = backing.offsetFor(address);

      return arena.gc.free(offset);
    }

    /**
     * Perform a full garbage collection cycle across all arenas, returning
     * the total number of bytes which were freed.
     *
     * Note: This is a blocking operation and can take a long time - GC rarely.
     */

  }, {
    key: "cycle",
    value: function cycle() {
      var backing = this.backing;
      var arenas = backing.arenas;
      var total = 0;
      for (var i = 0; i < arenas.length; i++) {
        total += arenas[i].gc.cycle();
      }
      this.lastCycledIndex = arenas.length - 1;
      return total;
    }

    /**
     * Perform an incremental garbage collection cycle across a single arena, returning
     * the total number of bytes which were freed.
     *
     * Note: This is a blocking operation and can take a long time - GC rarely.
     */

  }, {
    key: "incremental",
    value: function incremental() {
      var backing = this.backing;
      var arenas = backing.arenas;
      this.lastCycledIndex++;
      if (this.lastCycledIndex >= arenas.length) {
        this.lastCycledIndex = 0;
      }
      return arenas[this.lastCycledIndex].gc.cycle();
    }

    /**
     * Inspect all of the garbage collectors.
     */

  }, {
    key: "inspect",
    value: function inspect() {
      return this.backing.arenas.map(function (arena) {
        return arena.gc.inspect();
      });
    }
  }]);
  return AggregateGarbageCollector;
}();
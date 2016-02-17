"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _create = require("babel-runtime/core-js/object/create");

var _create2 = _interopRequireDefault(_create);

var _arena = require("../../arena");

var _ = require("../../");

var _2 = require("..");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Arena Source is responsible for locating, loading and creating arenas.
 */

var ArrayBufferArenaSource = function () {

  /**
   * Initialize the arena source.
   */


  /**
   * The number of garbage collection cycles an object with no references should live for.
   */


  /**
   * The array buffers for the source.
   */


  /**
   * The size of each arena.
   */


  /**
   * The name for this collection of arenas, which will be used as a name prefix.
   */

  function ArrayBufferArenaSource(backing, config) {
    (0, _classCallCheck3.default)(this, ArrayBufferArenaSource);

    this.backing = backing;
    this.name = backing.name;
    this.arenas = backing.arenas;
    this.arenaSize = backing.arenaSize;
    this.buffers = config.buffers || [];
    this.preallocateArenas = config.preallocateArenas || 1;
    this.lifetime = config.lifetime;
    this.internalSequence = 0;
    this.gcCallbacks = (0, _create2.default)(null);
  }

  /**
   * Initialize the arena source and load any existing arenas in order.
   */


  /**
   * The dictionary of callbacks which will be invoked when type-tagged blocks are freed.
   */


  /**
   * Keeps track of the number of arenas allocated
   */


  /**
   * The number of arenas to preallocate.
   */


  /**
   * The arenas which are being managed.
   */

  /**
   * The backing store the arena source is for.
   */


  (0, _createClass3.default)(ArrayBufferArenaSource, [{
    key: "init",
    value: function init() {
      var _this4 = this;

      var _this = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee() {
        var _this$arenas;

        var backing, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _loop, _iterator, _step;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                trace: "Loading existing arenas from " + _this.buffers.length + " buffers(s).";

                backing = _this.backing;
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 5;

                _loop = function _loop() {
                  var type = _step.value;

                  if (typeof type.cleanup === 'function') {
                    _this.gcCallbacks[type.id] = function (address) {
                      type.cleanup(backing, address);
                    };
                  }
                };

                for (_iterator = backing.registry[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  _loop();
                }

                _context.next = 14;
                break;

              case 10:
                _context.prev = 10;
                _context.t0 = _context["catch"](5);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 14:
                _context.prev = 14;
                _context.prev = 15;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 17:
                _context.prev = 17;

                if (!_didIteratorError) {
                  _context.next = 20;
                  break;
                }

                throw _iteratorError;

              case 20:
                return _context.finish(17);

              case 21:
                return _context.finish(14);

              case 22:
                backing.registry.on('add', function (type) {
                  if (typeof type.cleanup === 'function') {
                    _this.gcCallbacks[type.id] = function (address) {
                      type.cleanup(backing, address);
                    };
                  }
                });

                (_this$arenas = _this.arenas).push.apply(_this$arenas, (0, _toConsumableArray3.default)(_this.buffers.map(function (buffer) {
                  return _this.loadSync(buffer);
                })));

                trace: "Loaded " + _this.arenas.length + " arena(s).";

                if (!(_this.arenas.length === 0)) {
                  _context.next = 28;
                  break;
                }

                _context.next = 28;
                return _this.create();

              case 28:

                trace: "Initialization complete.";
                return _context.abrupt("return", _this);

              case 30:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, _this4, [[5, 10, 14, 22], [15,, 17, 21]]);
      }))();
    }

    /**
     * Load an arena from the given array buffer.
     */

  }, {
    key: "load",
    value: function load(buffer) {
      var _this5 = this;

      var _this2 = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee2() {
        var counter;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                counter = _this2.internalSequence;

                _this2.internalSequence++;

                trace: "Loading an arena from an array buffer of length " + buffer.byteLength + " into slot " + counter;

                return _context2.abrupt("return", new _arena.Arena({
                  name: _this2.name + "_" + counter,
                  sequenceNumber: counter,
                  buffer: buffer,
                  backing: _this2.backing,
                  gc: {
                    callbacks: _this2.gcCallbacks,
                    lifetime: _this2.lifetime
                  }
                }));

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, _this5);
      }))();
    }

    /**
     * Synchronously load an arena from the given array buffer.
     */

  }, {
    key: "loadSync",
    value: function loadSync(buffer) {

      var counter = this.internalSequence;
      this.internalSequence++;

      trace: "Loading an arena from an array buffer of length " + buffer.byteLength + " into slot " + counter;

      return new _arena.Arena({
        name: this.name + "_" + counter,
        sequenceNumber: counter,
        buffer: buffer,
        backing: this.backing,
        gc: {
          callbacks: this.gcCallbacks,
          lifetime: this.lifetime
        }
      });
    }

    /**
     * Create a new arena and append it to the list.
     */

  }, {
    key: "create",
    value: function create() {
      var _this6 = this;

      var _this3 = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee3() {
        var startIndex, i, buffer;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                trace: "Creating " + _this3.preallocateArenas + " arena(s) of " + _this3.arenaSize + " bytes.";

                startIndex = _this3.arenas.length;

                for (i = 0; i < _this3.preallocateArenas; i++) {
                  buffer = new ArrayBuffer(_this3.arenaSize);

                  _this3.buffers.push(buffer);
                  trace: "Created arena: " + buffer.byteLength + " at slot " + _this3.internalSequence + ".";
                  _this3.arenas.push(_this3.loadSync(buffer));
                }
                trace: "Created " + (_this3.arenas.length - startIndex) + " arena(s).";
                return _context3.abrupt("return", _this3.arenas[startIndex]);

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, _this6);
      }))();
    }

    /**
     * Synchronously create a new arena and append it to the list.
     */

  }, {
    key: "createSync",
    value: function createSync() {
      trace: "Creating " + this.preallocateArenas + " arena(s) of " + this.arenaSize + " bytes.";

      var startIndex = this.arenas.length;
      for (var _i = 0; _i < this.preallocateArenas; _i++) {
        var _buffer = new ArrayBuffer(this.arenaSize);
        this.buffers.push(_buffer);
        trace: "Created arena: " + _buffer.byteLength + " at slot " + this.internalSequence + ".";
        this.arenas.push(this.loadSync(_buffer));
      }
      trace: "Created " + (this.arenas.length - startIndex) + " arena(s).";
      return this.arenas[startIndex];
    }
  }]);
  return ArrayBufferArenaSource;
}();

exports.default = ArrayBufferArenaSource;
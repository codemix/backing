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

var _mmap2 = require("mmap.js");

var _mmap3 = _interopRequireDefault(_mmap2);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require("mkdirp");

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _arena = require("../../arena");

var _ = require("../../");

var _2 = require("../");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_fs2.default);
var mkdirpAsync = _bluebird2.default.promisify(_mkdirp2.default);

/**
 * Arena Source is responsible for locating, loading and creating arenas.
 */

var MMapArenaSource = function () {

  /**
   * Initialize the arena source.
   */


  /**
   * The number of garbage collection cycles an object with no references should live for.
   */


  /**
   * The size of each arena.
   */


  /**
   * The name of the directory containing the arenas.
   */

  /**
   * The backing store the arena source is for.
   */

  function MMapArenaSource(backing, config) {
    (0, _classCallCheck3.default)(this, MMapArenaSource);

    this.backing = backing;
    this.name = backing.name;
    this.arenas = backing.arenas;
    this.arenaSize = backing.arenaSize;
    var dirname = config.dirname;
    if (typeof dirname !== 'string' || !dirname.length) {
      throw new TypeError('Directory name must be specified.');
    }
    this.dirname = dirname;
    this.preallocateArenas = config.preallocateArenas || 1;
    this.lifetime = config.lifetime;
    this.gcCallbacks = (0, _create2.default)(null);
  }

  /**
   * Initialize the arena source and load any existing arenas in order.
   */


  /**
   * The dictionary of callbacks which will be invoked when type-tagged blocks are freed.
   */


  /**
   * The number of arenas to preallocate.
   */


  /**
   * The arenas which are being managed.
   */


  /**
   * The name for this collection of arenas, which will be used as a filename prefix.
   * Defaults to the basename of the dirname if not specified.
   */


  (0, _createClass3.default)(MMapArenaSource, [{
    key: "init",
    value: function init() {
      var _this6 = this;

      var _this = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee() {
        var _this$arenas;

        var filenames, backing, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _loop, _iterator, _step;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                trace: "Ensuring that the directory exists.";
                _context.next = 3;
                return mkdirpAsync(_this.dirname);

              case 3:
                _context.next = 5;
                return _this.findFilenames();

              case 5:
                filenames = _context.sent;
                backing = _this.backing;
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 10;

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

                _context.next = 19;
                break;

              case 15:
                _context.prev = 15;
                _context.t0 = _context["catch"](10);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 19:
                _context.prev = 19;
                _context.prev = 20;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 22:
                _context.prev = 22;

                if (!_didIteratorError) {
                  _context.next = 25;
                  break;
                }

                throw _iteratorError;

              case 25:
                return _context.finish(22);

              case 26:
                return _context.finish(19);

              case 27:
                backing.registry.on('add', function (type) {
                  if (typeof type.cleanup === 'function') {
                    _this.gcCallbacks[type.id] = function (address) {
                      type.cleanup(backing, address);
                    };
                  }
                });

                trace: "Loading existing arenas from " + filenames.length + " file(s).";
                _context.t1 = (_this$arenas = _this.arenas).push;
                _context.t2 = _this$arenas;
                _context.next = 33;
                return _bluebird2.default.map(filenames, function (filename) {
                  return _this.load(filename);
                });

              case 33:
                _context.t3 = _context.sent;
                _context.t4 = (0, _toConsumableArray3.default)(_context.t3);

                _context.t1.apply.call(_context.t1, _context.t2, _context.t4);

                trace: "Loaded " + _this.arenas.length + " arena(s).";

                if (!(_this.arenas.length === 0)) {
                  _context.next = 40;
                  break;
                }

                _context.next = 40;
                return _this.create();

              case 40:

                trace: "Initialization complete.";
                return _context.abrupt("return", _this);

              case 42:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, _this6, [[10, 15, 19, 27], [20,, 22, 26]]);
      }))();
    }

    /**
     * Load an arena from the given filename.
     */

  }, {
    key: "load",
    value: function load(filename) {
      var _this7 = this;

      var _this2 = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee2() {
        var fd, stats, buffer, sequenceNumber;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                trace: "Loading an arena from: " + _path2.default.basename(filename);

                _context2.next = 3;
                return _fs2.default.openAsync(filename, 'r+');

              case 3:
                fd = _context2.sent;
                _context2.next = 6;
                return _fs2.default.fstatAsync(fd);

              case 6:
                stats = _context2.sent;
                buffer = _this2.mmap(fd, stats.size);
                _context2.next = 10;
                return _fs2.default.closeAsync(fd);

              case 10:
                sequenceNumber = sequenceNumberForFilename(filename);
                return _context2.abrupt("return", new _arena.Arena({
                  name: filename,
                  sequenceNumber: sequenceNumberForFilename(filename),
                  buffer: buffer,
                  backing: _this2.backing,
                  gc: {
                    callbacks: _this2.gcCallbacks,
                    lifetime: _this2.lifetime
                  }
                }));

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, _this7);
      }))();
    }

    /**
     * Synchronously load an arena from the given filename.
     */

  }, {
    key: "loadSync",
    value: function loadSync(filename) {
      trace: "Loading an arena from: " + _path2.default.basename(filename);

      var fd = _fs2.default.openSync(filename, 'r+');
      var stats = _fs2.default.fstatSync(fd);
      var buffer = this.mmap(fd, stats.size);
      _fs2.default.closeSync(fd);
      var sequenceNumber = sequenceNumberForFilename(filename);

      return new _arena.Arena({
        name: filename,
        sequenceNumber: sequenceNumber,
        buffer: buffer,
        backing: this.backing,
        gc: {
          callbacks: this.gcCallbacks,
          lifetime: this.lifetime
        }
      });
    }

    /**
     * Find all the arena filenames in the directory and return them in order of sequence number.
     */

  }, {
    key: "findFilenames",
    value: function findFilenames() {
      var _this8 = this;

      var _this3 = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee3() {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _fs2.default.readdirAsync(_this3.dirname);

              case 2:
                _context3.t0 = function (item) {
                  return new RegExp(_this3.name + "_(\\d+)\\.arena$").test(item);
                };

                _context3.t1 = function (filename) {
                  return _path2.default.join(_this3.dirname, filename);
                };

                _context3.t2 = byFileSequenceNumber;
                return _context3.abrupt("return", _context3.sent.filter(_context3.t0).map(_context3.t1).sort(_context3.t2));

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, _this8);
      }))();
    }

    /**
     * Create a new arena and append it to the list.
     */

  }, {
    key: "create",
    value: function create() {
      var _this9 = this;

      var _this4 = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee4() {
        var _this4$arenas;

        var startIndex, arenas, i, filename;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                trace: "Creating " + _this4.preallocateArenas + " arena(s) of " + _this4.arenaSize + " bytes.";

                startIndex = _this4.arenas.length;
                arenas = [];
                i = 0;

              case 4:
                if (!(i < _this4.preallocateArenas)) {
                  _context4.next = 17;
                  break;
                }

                filename = _path2.default.join(_this4.dirname, _this4.name + "_" + (startIndex + i) + ".arena");
                _context4.next = 8;
                return _this4.createEmptyArena(filename);

              case 8:
                trace: "Created arena: " + _path2.default.basename(filename) + ".";
                _context4.t0 = arenas;
                _context4.next = 12;
                return _this4.load(filename);

              case 12:
                _context4.t1 = _context4.sent;

                _context4.t0.push.call(_context4.t0, _context4.t1);

              case 14:
                i++;
                _context4.next = 4;
                break;

              case 17:
                (_this4$arenas = _this4.arenas).push.apply(_this4$arenas, arenas);
                trace: "Created " + arenas.length + " arena(s).";
                return _context4.abrupt("return", arenas[0]);

              case 20:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, _this9);
      }))();
    }

    /**
     * Synchronously create a new arena and append it to the list.
     */

  }, {
    key: "createSync",
    value: function createSync() {
      var _arenas;

      trace: "Creating " + this.preallocateArenas + " arena(s) of " + this.arenaSize + " bytes.";

      var startIndex = this.arenas.length;
      var arenas = [];
      for (var _i = 0; _i < this.preallocateArenas; _i++) {
        var _filename = _path2.default.join(this.dirname, this.name + "_" + (startIndex + _i) + ".arena");
        this.createEmptyArenaSync(_filename);
        trace: "Created arena: " + _path2.default.basename(_filename) + ".";
        arenas.push(this.loadSync(_filename));
      }
      (_arenas = this.arenas).push.apply(_arenas, arenas);
      trace: "Created " + arenas.length + " arena(s).";

      return arenas[0];
    }

    /**
     * Create an empty arena.
     */

  }, {
    key: "createEmptyArena",
    value: function createEmptyArena(filename) {
      var _this10 = this;

      var _this5 = this;

      return (0, _asyncToGenerator3.default)(regeneratorRuntime.mark(function _callee5() {
        var fd;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                trace: "Creating empty arena: " + _path2.default.basename(filename);
                _context5.next = 3;
                return _fs2.default.openAsync(filename, 'w+');

              case 3:
                fd = _context5.sent;
                _context5.next = 6;
                return _fs2.default.ftruncateAsync(fd, _this5.arenaSize);

              case 6:
                _context5.next = 8;
                return _fs2.default.closeAsync(fd);

              case 8:
                return _context5.abrupt("return", _this5.arenaSize);

              case 9:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, _this10);
      }))();
    }

    /**
     * Synchronously create an empty arena.
     */

  }, {
    key: "createEmptyArenaSync",
    value: function createEmptyArenaSync(filename) {
      trace: "Creating empty arena: " + _path2.default.basename(filename);
      var fd = _fs2.default.openSync(filename, 'w+');
      _fs2.default.ftruncateSync(fd, this.arenaSize);
      _fs2.default.closeSync(fd);
    }

    /**
     * MMap a given file descriptor and return the buffer.
     */

  }, {
    key: "mmap",
    value: function mmap(fd, size) {
      trace: "Memory mapping " + size + " bytes from file #" + fd + ".";
      return _mmap3.default.alloc(size, _mmap3.default.PROT_READ | _mmap3.default.PROT_WRITE, _mmap3.default.MAP_SHARED, fd, 0);
    }
  }]);
  return MMapArenaSource;
}();

/**
 * Get the arena sequence number for the given filename.
 */


exports.default = MMapArenaSource;
function sequenceNumberForFilename(filename) {
  var matches = /_(\d+)\.arena/.exec(filename);
  if (matches === null) {
    throw new Error("Invalid arena filename.");
  }
  return +matches[1];
}

/**
 * Compare two filenames based on their sequence number.
 */
function byFileSequenceNumber(a, b) {
  var aSeq = sequenceNumberForFilename(a);
  var bSeq = sequenceNumberForFilename(b);
  if (aSeq > bSeq) {
    return 1;
  } else if (aSeq < bSeq) {
    return -1;
  } else {
    return 0;
  }
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MMapArenaSource = exports.ArrayBufferArenaSource = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _arrayBuffer = require("./array-buffer");

var _arrayBuffer2 = _interopRequireDefault(_arrayBuffer);

var _mmap = require("./mmap");

var _mmap2 = _interopRequireDefault(_mmap);

var _arena = require("../arena");

var _ = require("../");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.ArrayBufferArenaSource = _arrayBuffer2.default;
exports.MMapArenaSource = _mmap2.default;
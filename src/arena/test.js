import {Arena} from './';

describe('Arena', function () {
  const buffer = new ArrayBuffer(4096);
  let arena;
  let address;

  before(() => {
    arena = new Arena({
      sequenceNumber: 0,
      name: 'test_arena_0.js',
      buffer: buffer,
      byteOffset: 0,
      gc: {
        lifetime: 2,
        callbacks: {}
      }
    });
  });
  describe('.constructor()', function () {
    it('should create a new arena', function () {
      arena.should.be.an.instanceOf(Arena);
    });

    it('should not create an arena from an invalid buffer', function () {
      (() => {
        new Arena({
          sequenceNumber: 0,
          name: 'test_arena_0.js',
          buffer: {},
          byteOffset: 0,
          gc: {
            lifetime: 2,
            callbacks: {}
          }
        });
      }).should.throw(TypeError);
    });
  });

  describe('workflow', function () {
    it('should allocate a number of bytes', function () {
      address = arena.alloc(64);
    });

    it('should read the size of the address', function () {
      arena.sizeOf(address).should.equal(64);
    });

    it('should free the bytes', function () {
      arena.free(address).should.equal(64);
    });

    it('should calloc()', function () {
      address = arena.calloc(64);
    });

    it('should free the calloced bytes', function () {
      arena.free(address).should.equal(64);
    });
  });
});
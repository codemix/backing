import path from "path";
import rimraf from "rimraf";
import Bluebird from "bluebird";

const rm = Bluebird.promisify(rimraf);
import {Backing} from "./";
import TypeRegistry from "type-registry";
import randomNumbers from "../test/random.json";
import ArrayBufferArenaSource from "./arena-sources/array-buffer";
import {Arena} from "./arena";

const benchmark = createBenchmark();

ensureDeterministicRandom();

const ARENA_SIZE = 1 * 1024 * 1024;

describe('Backing', function () {
  let backing;
  describe('.constructor()', function () {
    it('should create an arena source from a function', function () {
      backing = new Backing({
        name: `test_backing`,
        arenaSize: ARENA_SIZE,
        arenaSource (backing) {
          return new ArrayBufferArenaSource(backing, {
            lifetime: 2
          });
        }
      });
    });
  });

  describe('.init()', function () {
    it('should initialize the backing', async function () {
      await backing.init();
    });

    it('should not initialize the backing twice', async function () {
      let threw = false;
      try {
        await backing.init();
      }
      catch (e) {
        threw = true;
      }
      threw.should.equal(true);
    });
  });

  describe('.arenaFor()', function () {
    let address;
    it('should allocate some bytes', function () {
      address = backing.alloc(64);
    });

    it('should access the arena for an address', function () {
      backing.arenaFor(address).should.be.an.instanceOf(Arena);
    });

    it('should throw if we try and access a too-low address', function () {
      (() => backing.arenaFor(-34)).should.throw(RangeError);
    });

    it('should throw if we try and access a too-high address', function () {
      (() => backing.arenaFor(999999999)).should.throw(RangeError);
    });
  });

  describe('.alloc()', function () {
    it('should normalize a too-small allocation size', function () {
      const address = backing.alloc(3);
      backing.sizeOf(address).should.equal(16);
      backing.free(address).should.equal(16);
    });
  });
});

['array-buffer', 'mmap'].forEach(function (type) {
  describe(`Backing: ${type}`, function () {
    const DIRNAME = path.resolve(__dirname, '..', 'data', `test${type}`);
    const registry = new TypeRegistry();

    let backing;
    const options = {};

    const mmapArenaSourceConfig = {
      type: type,
      dirname: DIRNAME,
      lifetime: 2
    };

    const arrayBufferArenaSourceConfig = {
      type: type,
      lifetime: 2
    };

    const arenaSourceConfig = type === 'mmap' ? mmapArenaSourceConfig : arrayBufferArenaSourceConfig;

    before(async () => {
      try {
        if (type === 'mmap') {
          await rm(DIRNAME);
        }
      }
      catch (e) {}


      backing = new Backing({
        name: `test_${type}`,
        arenaSize: ARENA_SIZE,
        registry: registry,
        arenaSource: arenaSourceConfig
      });
      options.backing = backing;
      await backing.init();
    });

    after(async () => {
      if (type === 'mmap') {
        await rm(DIRNAME);
      }
      backing = null;
      /* istanbul ignore if  */
      if (typeof gc === 'function') {
        gc();
      }
    });

    describe('.constructor()', function () {
      it('should create an instance without a type registry', function () {
        const instance = new Backing({
          name: `test2_${type}`,
          arenaSize: ARENA_SIZE,
          arenaSource: arenaSourceConfig
        });

        instance.registry.should.be.an.instanceOf(TypeRegistry);
      });
    });

    describe('.init()', function () {
      it('should create an instance and initialize it', function () {
        backing.isInitialized.should.equal(true);
      });

      it('should have set the max address', function () {
        backing.maxAddress.should.equal(ARENA_SIZE);
      });
    });

    describe('.getXYZ and .setXYZ methods.', function () {

      describe('int8', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setInt8(first, Math.pow(2, 7) - 1);
          backing.setInt8(second, Math.pow(2, 7) - 1);
        });

        it('should read a value from an address', function () {
          backing.getInt8(first).should.equal(Math.pow(2, 7) - 1);
          backing.getInt8(second).should.equal(Math.pow(2, 7) - 1);
        });


        it('should write a negative value to an address', function () {
          backing.setInt8(first, -(Math.pow(2, 7) - 1));
          backing.setInt8(second, -(Math.pow(2, 7) - 1));
        });

        it('should read a negative value from an address', function () {
          backing.getInt8(first).should.equal(-(Math.pow(2, 7) - 1));
          backing.getInt8(second).should.equal(-(Math.pow(2, 7) - 1));
        });
      });

      describe('uint8', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setUint8(first, Math.pow(2, 8) - 1);
          backing.setUint8(second, Math.pow(2, 8) - 1);
        });

        it('should read a value from an address', function () {
          backing.getUint8(first).should.equal(Math.pow(2, 8) - 1);
          backing.getUint8(second).should.equal(Math.pow(2, 8) - 1);
        });
      });

      describe('int16', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setInt16(first, Math.pow(2, 15) - 1);
          backing.setInt16(second, Math.pow(2, 15) - 1);
        });

        it('should read a value from an address', function () {
          backing.getInt16(first).should.equal(Math.pow(2, 15) - 1);
          backing.getInt16(second).should.equal(Math.pow(2, 15) - 1);
        });


        it('should write a negative value to an address', function () {
          backing.setInt16(first, -(Math.pow(2, 15) - 1));
          backing.setInt16(second, -(Math.pow(2, 15) - 1));
        });

        it('should read a negative value from an address', function () {
          backing.getInt16(first).should.equal(-(Math.pow(2, 15) - 1));
          backing.getInt16(second).should.equal(-(Math.pow(2, 15) - 1));
        });
      });

      describe('uint16', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setUint16(first, Math.pow(2, 16) - 1);
          backing.setUint16(second, Math.pow(2, 16) - 1);
        });

        it('should read a value from an address', function () {
          backing.getUint16(first).should.equal(Math.pow(2, 16) - 1);
          backing.getUint16(second).should.equal(Math.pow(2, 16) - 1);
        });
      });

      describe('int32', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setInt32(first, Math.pow(2, 31) - 1);
          backing.setInt32(second, Math.pow(2, 31) - 1);
        });

        it('should read a value from an address', function () {
          backing.getInt32(first).should.equal(Math.pow(2, 31) - 1);
          backing.getInt32(second).should.equal(Math.pow(2, 31) - 1);
        });


        it('should write a negative value to an address', function () {
          backing.setInt32(first, -(Math.pow(2, 31) - 1));
          backing.setInt32(second, -(Math.pow(2, 31) - 1));
        });

        it('should read a negative value from an address', function () {
          backing.getInt32(first).should.equal(-(Math.pow(2, 31) - 1));
          backing.getInt32(second).should.equal(-(Math.pow(2, 31) - 1));
        });
      });

      describe('uint32', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setUint32(first, Math.pow(2, 32) - 1);
          backing.setUint32(second, Math.pow(2, 32) - 1);
        });

        it('should read a value from an address', function () {
          backing.getUint32(first).should.equal(Math.pow(2, 32) - 1);
          backing.getUint32(second).should.equal(Math.pow(2, 32) - 1);
        });
      });

      describe('float32', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setFloat32(first, 123.456);
          backing.setFloat32(second, 123.456);
        });

        it('should read a value from an address', function () {
          Math.fround(backing.getFloat32(first)).should.equal(Math.fround(123.456));
          Math.fround(backing.getFloat32(second)).should.equal(Math.fround(123.456));
        });
      });

      describe('float64', function () {
        let first, second;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setFloat64(first, 123.456);
          backing.setFloat64(second, 123.456);
        });

        it('should read a value from an address', function () {
          backing.getFloat64(first).should.equal(123.456);
          backing.getFloat64(second).should.equal(123.456);
        });
      });


      describe('utf8', function () {
        let first, second;
        let firstInput = "hello world";
        let secondInput = `ᚠᛇᚻ᛫ᛒᛦᚦ᛫ᚠᚱᚩᚠᚢᚱ᛫ᚠᛁᚱᚪ᛫ᚷᛖᚻᚹᛦᛚᚳᚢᛗ ᛋᚳᛖᚪᛚ᛫ᚦᛖᚪᚻ᛫ᛗᚪᚾᚾᚪ᛫ᚷᛖᚻᚹᛦᛚᚳ᛫ᛗᛁᚳᛚᚢᚾ᛫ᚻᛦᛏ᛫ᛞᚫᛚᚪᚾ ᚷᛁᚠ᛫ᚻᛖ᛫ᚹᛁᛚᛖ᛫ᚠᚩᚱ᛫ᛞᚱᛁᚻᛏᚾᛖ᛫ᛞᚩᛗᛖᛋ᛫ᚻᛚᛇᛏᚪᚾ᛬`;
        before(() => {
          first = backing.alloc(ARENA_SIZE / 2);
          second = backing.alloc(ARENA_SIZE / 2);
        });

        after(() => {
          backing.free(first);
          backing.free(second);
        });

        it('should write a value to an address', function () {
          backing.setUtf8(first, firstInput);
          backing.setUtf8(second, secondInput);
        });

        it('should read a value from an address', function () {
          backing.getUtf8(first, backing.utf8ByteLength(firstInput)).should.equal(firstInput);
          backing.getUtf8(second, backing.utf8ByteLength(secondInput)).should.equal(secondInput);
        });
      });

    });

    describe('.alloc(), .sizeOf() and .free()', function () {
      let address;
      it('should allocate some space', function () {
        address = backing.alloc(64);
      });

      it('should have allocated the right size', function () {
        backing.sizeOf(address).should.equal(64);
      });

      it('should free the block', function () {
        backing.free(address).should.equal(64);
      });
    });

    describe('.alloc()', function () {
      let address1, address2;
      it('should fail to allocate more than the arena size', function () {
        (() => backing.alloc(ARENA_SIZE + 10)).should.throw(RangeError);
      });

      it('should allocate enough space to cause allocation of a second arena', function () {
        address1 = backing.alloc(ARENA_SIZE / 2);
        address2 = backing.alloc(ARENA_SIZE / 2);
      });

      it('should have increased the number of arenas', function () {
        backing.arenas.length.should.equal(2);
      });

      it('should have allocated the second address in the second arena', function () {
        const arena = backing.arenaFor(address2);
        arena.sequenceNumber.should.equal(1);
      });
    });

    describe('.calloc()', function () {
      let address;
      it('should allocate', function () {
        address = backing.calloc(64);
      });

      it('should have cleared all the bytes', function () {
        const uint8Array = backing.arenaFor(address).uint8Array;
        const offset = backing.offsetFor(address);
        for (let i = 0; i < 64; i++) {
          uint8Array[offset + i].should.equal(0);
        }
      });

      it('should fail to allocate more than the arena size', function () {
        (() => backing.calloc(ARENA_SIZE + 10)).should.throw(RangeError);
      });
    });

    describe('.copy()', function () {
      let target, source;
      before(() => {
        source = backing.calloc(64);
        target = backing.calloc(64);
      });

      it('should write some data to the source', function () {
        for (let i = 0; i < 64; i += 4) {
          backing.setUint32(source + i, i);
        }
      });

      it('should copy some bytes from one address to another', function () {
        backing.copy(target, source, 3 * 4);
      });

      it('should have copied correctly', function () {
        for (let i = 0; i < 3 * 4; i += 4) {
          backing.getUint32(target + i).should.equal(i);
        }
        for (let i = 3 * 4; i < 64; i += 4) {
          backing.getUint32(target + i).should.equal(0);
        }
      });

      it('should copy all the bytes from one address to another', function () {
        backing.copy(target, source, 64);
      });

      it('should have copied correctly', function () {
        for (let i = 0; i < 64; i += 4) {
          backing.getUint32(target + i).should.equal(i);
        }
      });
    });

    describe('.gc', function () {
      describe('.alloc(), .sizeOf() and .free()', function () {
        let address;
        it('should allocate some space', function () {
          address = backing.gc.alloc(64);
        });

        it('should have allocated the right size', function () {
          backing.gc.sizeOf(address).should.equal(64);
        });

        it('should free the block', function () {
          backing.gc.free(address).should.equal(64 + 16);
        });
      });

      describe('.alloc()', function () {
        let address1, address2;
        it('should fail to allocate more than the arena size', function () {
          (() => backing.alloc(ARENA_SIZE + 10)).should.throw(RangeError);
          backing.arenas.length.should.equal(2);
        });

        it('should allocate enough space to cause allocation of a second arena', function () {
          address1 = backing.gc.alloc(ARENA_SIZE / 2);
          address2 = backing.gc.alloc(ARENA_SIZE / 2);
        });

        it('should have increased the number of arenas', function () {
          backing.arenas.length.should.equal(4);
        });

        it('should have allocated the second address in the third arena', function () {
          const arena = backing.arenaFor(address2);
          arena.sequenceNumber.should.equal(3);
        });
      });

      describe('.calloc()', function () {
        let address;
        it('should allocate', function () {
          address = backing.gc.calloc(64);
        });

        it('should have cleared all the bytes', function () {
          const uint8Array = backing.arenaFor(address).uint8Array;
          const offset = backing.offsetFor(address);
          for (let i = 0; i < 64; i++) {
            uint8Array[offset + i].should.equal(0);
          }
        });

        it('should fail to allocate more than the arena size', function () {
          (() => backing.gc.calloc(ARENA_SIZE + 10)).should.throw(RangeError);
        });
      });


      describe('lifecycle', function () {
        let address1, address2;
        let invokedDestructor = false;
        registry.add({
          id: 1,
          name: 'uint32',
          destructor (backing, address) {
            const pointer = backing.getFloat64(address);
            /* istanbul ignore else  */
            if (pointer !== 0) {
              backing.gc.unref(pointer);
              backing.setFloat64(address, 0);
            }
          }
        });

        registry.add({
          id: 2,
          name: 'thing',
          destructor (backing, address) {
            invokedDestructor = true;
          }
        });

        it('should cycle a few times to remove old references', function () {
          backing.gc.cycle();
          backing.gc.cycle();
          backing.gc.cycle().should.equal(0);
        });

        it('should allocate some bytes, tagged as a uint32', function () {
          address1 = backing.gc.alloc(16, 1);
        });

        it('should have refCount of zero', function () {
          backing.gc.refCount(address1).should.equal(0);
        });

        it('should read the size of the address', function () {
          backing.gc.sizeOf(address1).should.equal(16);
        });

        it('should return the appropriate type for an address', function () {
          backing.gc.typeOf(address1).should.equal(registry.get(1));
        });

        it('should allocate the second address', function () {
          address2 = backing.gc.alloc(24, 2);
        });

        it('the second address should have refCount of zero', function () {
          backing.gc.refCount(address2).should.equal(0);
        });

        it('should add a reference to the second address from the first', function () {
          backing.setFloat64(address1, address2);
          backing.gc.ref(address2);
        });

        it('should have refCount of 1', function () {
          backing.gc.refCount(address2).should.equal(1);
        });

        it('should perform a garbage collection cycle, but collect nothing', function () {
          backing.gc.cycle().should.equal(0);
        });

        it('should cycle again, freeing the first address', function () {
          backing.gc.cycle().should.equal(16 + 16);
        });

        it('should perform a garbage collection cycle, but collect nothing', function () {
          backing.gc.cycle().should.equal(0);
        });

        it('should cycle again, freeing the second address', function () {
          invokedDestructor.should.equal(false);
          backing.gc.cycle().should.equal(24 + 16);
          invokedDestructor.should.equal(true);
          invokedDestructor = false;
        });
      });
    });

    /* istanbul ignore else  */
    if (!process.env.BLOCKSTORE_FAST_TESTS) {
      // Warning: Increasing the number of mutations has an exponential effect on test time.
      mutate(options, [
        128,
        64,
        96,
        256,
        128,
        72,
        256
      ]);
    }

    /* istanbul ignore next  */
    (process.env.NODE_ENV !== "production" ? describe.skip : describe)('Benchmarks', function () {
      benchmark('alloc, sizeOf & free', 100000, {
        default () {
          const address = backing.alloc(64);
          const size = backing.sizeOf(address);
          const result = backing.free(address);
          if (result < 64 || result > 64 + 16) {
            throw new Error(`Fail! Expected 64(+16) got ${result} ${size}`);
          }
          return size;
        },
        gc () {
          const address = backing.gc.alloc(64);
          const size = backing.gc.sizeOf(address);
          const result = backing.gc.free(address);
          if (result < 64 + 16 || result > 64 + 16 + 16) {
            throw new Error(`Fail! Expected ${64 + 16}(+16) got ${result}`);
          }
          return size;
        }
      });
    });
  });
});


/* istanbul ignore next  */
function d (input) {
  console.log(JSON.stringify(input, null, 2));
}

/* istanbul ignore next  */
function permutations (input: Array) {
  if (input.length == 0) {
    return [[]];
  }
  const result = [];
  for (let i = 0; i < input.length; i++) {
    const clone = input.slice();
    const start = clone.splice(i, 1);
    const tail = permutations(clone);
    for (let j = 0; j < tail.length; j++) {
      result.push(start.concat(tail[j]));
    }
  }

  return result;
}

/* istanbul ignore next  */
function debugOnce (input) {
  return [input];
}

/* istanbul ignore next  */
function createBenchmark () {

  function benchmark (name, limit, ...fns) {
    let factor = 1;
    if (typeof limit === 'function') {
      fns.unshift(limit);
      limit = 1000;
    }
    if (typeof fns[0] === 'number') {
      factor = fns.shift();
    }
    it(`benchmark: ${name}`, benchmarkRunner(name, limit, factor, flattenBenchmarkFunctions(fns)));
  };

  benchmark.skip = function skipBenchmark (name) {
    it.skip(`benchmark: ${name}`);
  }

  benchmark.only = function benchmark (name, limit, ...fns) {
    let factor = 1;
    if (typeof limit !== 'number') {
      fns.unshift(limit);
      limit = 1000;
    }
    if (typeof fns[0] === 'number') {
      factor = fns.shift();
    }
    it.only(`benchmark: ${name}`, benchmarkRunner(name, limit, factor, flattenBenchmarkFunctions(fns)));
  };


  function benchmarkRunner (name, limit, factor, fns) {
    return async function () {
      this.timeout(10000);
      console.log(`\tStarting benchmark: ${name}\n`);
      let fastest = {
        name: null,
        score: null
      };
      let slowest = {
        name: null,
        score: null
      };
      fns.forEach(([name,fn]) => {
        const start = process.hrtime();
        for (let j = 0; j < limit; j++) {
          fn(j, limit);
        }
        let [seconds, ns] = process.hrtime(start);
        seconds += ns / 1000000000;
        const perSecond = Math.round(limit / seconds) * factor;
        if (fastest.score === null || fastest.score < perSecond) {
          fastest.name = name;
          fastest.score = perSecond;
        }
        if (slowest.score === null || slowest.score > perSecond) {
          slowest.name = name;
          slowest.score = perSecond;
        }
        console.log(`\t${name} benchmark done in ${seconds.toFixed(4)} seconds, ${perSecond} operations per second.`);
      });
      if (fns.length > 1) {
        const diff = (fastest.score - slowest.score) / slowest.score * 100;
        console.log(`\n\t${fastest.name} was ${diff.toFixed(2)}% faster than ${slowest.name}`);
      }
    };
  }

  function flattenBenchmarkFunctions (fns: Array<Object|Function>): Array {
    return fns.reduce((flat, item, index) => {
      if (typeof item === "object") {
        flat.push(...Object.keys(item).map(name => [name, item[name]]));
      }
      else {
        flat.push([item.name || "fn" + index, item]);
      }
      return flat;
    }, []);
  }

  return benchmark;
}

function ensureDeterministicRandom () {
  let index = 3;
  Math.random = function () {
    return randomNumbers[index++ % randomNumbers.length];
  };
}

/* istanbul ignore next  */
function mutate (options, input: number[]) {
  //debugOnce([128, 64, 256, 128, 256, 96, 72]).forEach(sizes => {

  permutations(input).forEach(sizes => {
    describe(`Sizes: ${sizes.join(', ')}`, function () {
      let backing;
      before(() => {
        backing = options.backing;
      });
      describe('Sequential', function () {
        let freeable = 0;

        let addresses;
        it('should allocate', function () {
          addresses = sizes.map(item => backing.gc.alloc(item));
        });

        it('should inspect the results', function () {
          addresses.forEach((address, index) => {
            backing.gc.sizeOf(address).should.be.within(sizes[index], sizes[index] + 16);
          });
        });

        it('should increment the reference count of every other item', function () {
          addresses.forEach((address, index) => {
            if (index % 2 === 0) {
              backing.gc.ref(address);
            }
            else {
              freeable += backing.gc.sizeOf(address) + 16;
            }
          });
        });

        it('should perform a garbage collection cycle, but not collect anything', function () {
          backing.gc.cycle().should.equal(0);
        });

        it('should cycle again, this time collecting half of the addresses', function () {
          backing.gc.cycle().should.equal(freeable);
          freeable = 0;
        });

        it('should decrement the reference count of every other item', function () {
          addresses.forEach((address, index) => {
            if (index % 2 === 0) {
              backing.gc.unref(address);
              freeable += backing.gc.sizeOf(address) + 16;
            }
          });
        });

        it('should perform a garbage collection cycle, but not collect anything', function () {
          backing.gc.cycle().should.equal(0);
        });

        it('should cycle again, this time collecting the remaining half of the addresses', function () {
          backing.gc.cycle().should.equal(freeable);
          freeable = 0;
        });

      });



      describe('Alloc & Free', function () {
        let freeable = 0;
        let addresses;
        it('should allocate', function () {
          addresses = sizes.map(address => backing.gc.alloc(address));
        });
        it('should free & alloc again', function () {
          addresses = addresses.map((address, index) => {
            const size = sizes[(index + 1) % sizes.length];
            backing.gc.free(address);
            return backing.gc.alloc(size);
          });
        });

        it('should unref the blocks', function () {
          addresses.forEach(address => backing.gc.unref(address));
        });

        it('should perform a garbage collection cycle, but not collect anything', function () {
          backing.gc.cycle().should.equal(0);
        });

        it('should inspect the collectible blocks', function () {
          addresses.forEach((address, index) => {
            freeable += backing.gc.sizeOf(address) + 16;
          });
        });

        it('should perform a garbage collection cycle and collect all the freeable blocks', function () {
          backing.gc.cycle().should.equal(freeable);
        });
      });

      describe('Alloc, Alloc, Free, Reverse, Alloc', function () {
        let freeable = 0;
        let extraFreeable = 0;
        let addresses, extra;
        it('should allocate', function () {
          addresses = sizes.reduce((addresses, size) => {
            return addresses.concat(backing.gc.alloc(size), backing.gc.alloc(size));
          }, []);
          addresses.every(value => value.should.be.above(0));
        });

        it('should unref half of the allocated addresses', function () {
          addresses = addresses.map((address, index) => {
            if (index % 2 === 0) {
              backing.gc.ref(address);
              return address;
            }
            else {
              backing.gc.unref(address);
              freeable += backing.gc.sizeOf(address) + 16;
            }
          }).filter(id => id);
        });

        it('should perform a garbage collection cycle, but not collect anything', function () {
          backing.gc.cycle().should.equal(0);
        });

        it('should allocate', function () {
          extra = sizes.reduce((addresses, size) => {
            extraFreeable += size + 16;
            return addresses.concat(backing.gc.alloc(size));
          }, []);
        });

        it('should perform a garbage collection cycle and remove all freeable items', function () {
          backing.gc.cycle().should.be.within(freeable, freeable + 16);
        });

        it('should perform a garbage collection cycle and collect all the extra blocks', function () {
          backing.gc.cycle().should.be.within(extraFreeable, extraFreeable + 16);
        });

      });
    });
  });
}
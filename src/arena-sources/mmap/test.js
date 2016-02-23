import path from "path";
import rimraf from "rimraf";
import Bluebird from "bluebird";

const rm = Bluebird.promisify(rimraf);
import {Backing} from "../../";
import TypeRegistry from "type-registry";

import {byFileSequenceNumber} from './';

describe(`MMapArenaSource`, function () {
  const DIRNAME = path.resolve(__dirname, '..', '..', '..', 'data', 'MMapArenaSource');
  const ARENA_SIZE = 1 * 1024 * 1024;
  const registry = new TypeRegistry();
  let destructorInvoked = 0;
  const Thing = {
    id: 123,
    name: 'Thing',
    destructor () {
      destructorInvoked++;
    }
  };

  const Other = {
    id: 456,
    name: 'Other'
  };

  registry.add(Other);


  const Another = {
    id: 789,
    name: 'Another'
  };


  let backing;

  before(async () => {
    try {
      await rm(DIRNAME);
    }
    catch (e) {}

    backing = new Backing({
      name: `MMapArenaSourceTest`,
      arenaSize: ARENA_SIZE,
      registry: registry,
      arenaSource: {
        type: 'mmap',
        dirname: DIRNAME,
        lifetime: 2
      }
    });
    await backing.init();
  });

  after(async () => {
    await rm(DIRNAME);
    backing = null;
    /* istanbul ignore if  */
    if (typeof gc === 'function') {
      gc();
    }
  });

  describe('.constructor()', function () {
    it('should not create an instance without a dirname', function () {
      (function () {
        new Backing({
          name: `MMapArenaSourceTest`,
          arenaSize: ARENA_SIZE,
          registry: registry,
          arenaSource: {
            type: 'mmap',
            lifetime: 2
          }
        });
      }).should.throw(TypeError);
    });

    it('should not create an instance with an empty dirname', function () {
      (function () {
        new Backing({
          name: `MMapArenaSourceTest`,
          arenaSize: ARENA_SIZE,
          registry: registry,
          arenaSource: {
            type: 'mmap',
            dirname: '',
            lifetime: 2
          }
        });
      }).should.throw(TypeError);
    });
  });

  describe('.gcCallbacks', function () {
    let address;
    it('should not initially have any gc callbacks', function () {
      Object.keys(backing.arenaSource.gcCallbacks).length.should.equal(0);
    });

    it('should add a garbage collectible type to the registry', function () {
      registry.add(Thing);
    });

    it('should now have the gc callback in the list', function () {
      Object.keys(backing.arenaSource.gcCallbacks).length.should.equal(1);
    });

    it('should be indexed with the right id', function () {
      (typeof backing.arenaSource.gcCallbacks[123]).should.equal('function');
    });

    it('should add a non-garbage-collectible type', function () {
      registry.add(Another);
    });

    it('should not have added a gc callback to the list', function () {
      Object.keys(backing.arenaSource.gcCallbacks).length.should.equal(1);
    });

    it('should allocate a Thing', function () {
      address = backing.gc.alloc(64, Thing.id);
    });

    it('should perform 2 gc cycles', function () {
      destructorInvoked.should.equal(0);
      backing.gc.cycle();
      destructorInvoked.should.equal(0);
      backing.gc.cycle();
    });

    it('should have invoked the destructor', function () {
      destructorInvoked.should.equal(1);
    });

  });

  describe('.load()', function () {
    const addresses = [];
    let dupe;
    it('should first create several arenas', function () {
      addresses.push(...Array.from({length: 10}, (_, index) => {
        const address = backing.gc.alloc(ARENA_SIZE - 4096);
        backing.setUint32(address, index);
        return address;
      }));
    });

    it('should load up the backing store again', async function () {
      dupe = new Backing({
        name: `MMapArenaSourceTest`,
        arenaSize: ARENA_SIZE,
        arenaSource: {
          type: 'mmap',
          dirname: DIRNAME,
          lifetime: 2
        }
      });

      await dupe.init();
    });

    it('should load the right values from the previously allocated addresses', function () {
      addresses.length.should.equal(10);
      addresses.forEach((address, index) => {
        dupe.getUint32(address).should.equal(index);
      });
    });

    it('should share an address space', function () {
      addresses.length.should.equal(10);
      addresses.forEach((address, index) => {
        dupe.setUint32(address, index * 10);
        backing.getUint32(address).should.equal(index * 10);
      });
    });

  });

  describe('byFileSequenceNumber()', function () {
    it('should sort a list of filenames into expected order', function () {
      [
        'test_0.arena',
        'test_10.arena',
        'test_1.arena',
        'test_20.arena',
        'test_21.arena',
        'test_9999.arena',
        'test_2.arena',
        'test_3.arena'
      ]
      .sort(byFileSequenceNumber)
      .should.eql([
        'test_0.arena',
        'test_1.arena',
        'test_2.arena',
        'test_3.arena',
        'test_10.arena',
        'test_20.arena',
        'test_21.arena',
        'test_9999.arena'
      ]);
    });

    it('should throw when passed invalid filenames', function () {
      (() => ['nope', 'no'].sort(byFileSequenceNumber)).should.throw(Error);
    });

    it('should throw when receiving duplicate filenames', function () {
      (() => ['test_0.arena', 'test_0.arena'].sort(byFileSequenceNumber)).should.throw(Error);
    });
  });
});
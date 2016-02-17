import {Backing} from "../../";
import TypeRegistry from "type-registry";

describe(`ArrayBufferArenaSource`, function () {
  const ARENA_SIZE = 1 * 1024 * 1024;
  const registry = new TypeRegistry();
  const buffers = [];
  let cleanupInvoked = 0;
  const Thing = {
    id: 123,
    name: 'Thing',
    cleanup () {
      cleanupInvoked++;
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
    backing = new Backing({
      name: `ArrayBufferArenaSourceTest`,
      arenaSize: ARENA_SIZE,
      registry: registry,
      arenaSource: {
        type: 'array-buffer',
        buffers: buffers,
        lifetime: 2
      }
    });
    await backing.init();
  });

  after(async () => {
    backing = null;
    /* istanbul ignore if  */
    if (typeof gc === 'function') {
      gc();
    }
  });

  describe('.constructor()', function () {
    it('should not create an instance with a dirname', function () {
      (function () {
        new Backing({
          name: `ArrayBufferArenaSourceTest`,
          arenaSize: ARENA_SIZE,
          registry: registry,
          arenaSource: {
            type: 'array-buffer',
            dirname: __dirname,
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
      cleanupInvoked.should.equal(0);
      backing.gc.cycle();
      cleanupInvoked.should.equal(0);
      backing.gc.cycle();
    });

    it('should have invoked the cleanup', function () {
      cleanupInvoked.should.equal(1);
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
        name: `ArrayBufferArenaSourceTest`,
        arenaSize: ARENA_SIZE,
        arenaSource: {
          type: 'array-buffer',
          buffers: buffers,
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

});
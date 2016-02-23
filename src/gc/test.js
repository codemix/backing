import {Backing} from "../";
import TypeRegistry from "type-registry";

describe(`GC`, function () {
  const ARENA_SIZE = 1 * 1024 * 1024;
  const registry = new TypeRegistry();
  const buffers = [];
  let destructorInvoked = 0;
  const Thing = {
    id: 123,
    name: 'Thing',
    destructor () {
      destructorInvoked++;
    }
  };
  registry.add(Thing);

  let backing;

  before(async () => {
    backing = new Backing({
      name: `GCTest`,
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

  describe('.alloc()', function () {
    it('should allocate a number of bytes', function () {
      const address = backing.gc.alloc(64);
      backing.gc.sizeOf(address).should.equal(64);
    });

    it('should normalize the size of a too-small allocation', function () {
      const address = backing.gc.alloc(2);
      backing.gc.sizeOf(address).should.equal(16);
    });

    it('should throw if we try and allocate too much', function () {
      (() => {
        backing.gc.alloc(ARENA_SIZE);
      }).should.throw(Error);
    });

    it('should allocate with a type', function () {
      const address = backing.gc.alloc(64, Thing.id);
      backing.gc.typeOf(address).should.equal(Thing);
    });

  });

  describe('.calloc()', function () {
    it('should allocate a number of bytes', function () {
      const address = backing.gc.calloc(64);
      backing.gc.sizeOf(address).should.equal(64);
    });

    it('should normalize the size of a too-small allocation', function () {
      const address = backing.gc.calloc(2);
      backing.gc.sizeOf(address).should.equal(16);
    });

    it('should throw if we try and allocate too much', function () {
      (() => {
        backing.gc.calloc(ARENA_SIZE);
      }).should.throw(Error);
    });

    it('should cause allocation of a new arena', function () {
      backing.gc.calloc(ARENA_SIZE / 2);
      backing.gc.calloc(ARENA_SIZE / 2);
    });


    it('should calloc with a type', function () {
      const address = backing.gc.calloc(64, Thing.id);
      backing.gc.typeOf(address).should.equal(Thing);
    });
  });

  describe('.sizeOf()', function () {
    let address;
    before(() => {
      address = backing.gc.alloc(64);
    });
    it('should read the size of an address', function () {
      backing.gc.sizeOf(address).should.equal(64);
    });
  });


  describe('.typeOf()', function () {
    let thing, other;
    before(() => {
      thing = backing.gc.alloc(64, Thing.id);
      other = backing.gc.alloc(64);
    });
    it('should read the type of a typed address', function () {
      backing.gc.typeOf(thing).should.equal(Thing);
    });
    it('should read the type of an untyped address', function () {
      (backing.gc.typeOf(other) === undefined).should.equal(true);
    });

  });

  describe('.inspect()', function () {
    it('should allocate some addresses', function () {
      backing.gc.alloc(64);
      backing.gc.alloc(64);
    });

    it('should inspect the gc', function () {
      backing.gc.inspect().length.should.equal(2);
    });
  });

  describe('.incremental()', function () {
    it('should allocate some addresses', function () {
      backing.gc.alloc(64);
      backing.gc.alloc(64);
    });

    it('should perform an incremental garbage collection cycle', function () {
      backing.gc.incremental();
      backing.gc.incremental();
      backing.gc.incremental();
      backing.gc.incremental();
      backing.gc.incremental();
    });
  });
});
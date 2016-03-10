# backing
Persistent storage for typed arrays / buffers.

[![Build Status](https://travis-ci.org/codemix/backing.svg?branch=master)](https://travis-ci.org/codemix/backing)

## What?
Provides a virtual address space for large segments of memory via ArrayBuffers, and operations for `alloc()`ing and `free()`ing
within the address space, optionally via a simple reference counting garbage collector.
These large segments of data can optionally be automatically persisted to disk, (and shared with other processes!) via [mmap](https://github.com/indutny/mmap.js).

## Installation

Install via [npm](https://npmjs.org/package/backing).
```sh
npm install backing
```

## Usage

```js
import Backing from "backing";

const store = new Backing({
  name: "demo",
  /**
   * The number of bytes which will be preallocated at a time.
   * Note that this imposes an upper bound on the largest possible
   * size of a block in the store.
   * On the server you should usually set this to the largest permissible value: 2Gb.
   */
  arenaSize: 16 * 1024 * 1024, // 16Mb
  arenaSource: {
    type: 'mmap', // Can also be 'array-buffer'
    /**
     * The full path to the directory containing the data files.
     */
    dirname: __dirname + '/data',
    /**
     * The number of garbage collection cycles a value should persist for until it is cleaned up.
     */
    lifetime: 2
  }
});

async function run () {
  await store.init();

  const address = store.alloc(64);

  store.setInt32(address, 123);

  console.log(store.getInt32(address)); // 123

  store.free(address); // 64

  // Garbage collector

  const address2 = store.gc.alloc(64);
  store.setFloat64(address2, 456.789);
  console.log(store.gc.sizeOf(address2));
  console.log(store.getFloat64(address2));

  store.gc.ref(address2); // Add a reference to our address

  store.gc.cycle(); // our value is preserved.

  store.gc.unref(address2); // Decrement the reference count, now 0.

  let freed = store.gc.cycle(); // our value is preserved but its cycle count is incremented.
  console.log(freed); // 0;

  freed = store.gc.cycle(); // our value is garbage collected because its cycle count reached 2.
  console.log(freed); // 64 + 16 = 80 bytes. The 16 bytes is the overhead of a garbage collectible block.
}

run();
```


## License

Published by [codemix](http://codemix.com/) under a permissive MIT License, see [LICENSE.md](./LICENSE.md).

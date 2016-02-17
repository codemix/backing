"use strict";
var Backing = require("./");

function go () {
  var backing = new Backing({
    name: 'perf',
    arenaSize: 20 * 1024 * 1024,
    arenaSource: {
      type: 'mmap',
      dirname: __dirname + '/data'
    }
  })
  backing.init().then(function runner () {
    const addresses = [];
    for (var i = 0; i < 10000; i++) {
      var address = backing.gc.alloc(512);
      backing.gc.ref(address);
      addresses.push(address);
      if (i > 6 && i % 3 === 0) {
        backing.gc.unref(addresses[i - 3]);
        addresses[i - 3] = 0;
      }
    }
    backing.gc.cycle();

    for (var i = 0; i < addresses.length; i++) {
      if (addresses[i] !== 0) {
        backing.gc.unref(addresses[i]);
      }
    }

    backing.gc.cycle();
    backing.gc.cycle();

    console.log(backing.gc.inspect());
  }).catch(function (e) {
    console.log(e.stack);
  });
}

go();
try {
  (new Function('var a = (args) => true; var b = []; b.push(...b);'))();
  console.log('Using modern ES environment.');
  require("babel-register")();
}
catch (e) {
  console.log('Using legacy ES environment.', e.stack);
  // Legacy environment.
  require("babel-register")({
    "presets": ["es2015", "stage-0", "react"],
    "plugins": [
      "transform-runtime"
    ],
    "passPerPreset": true
  });
}


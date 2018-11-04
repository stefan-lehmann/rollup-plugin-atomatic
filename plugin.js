const
  path = require('path'),
  atomatic = require('atomatic'),
  compiler = require('./compiler');

module.exports = (options = {}) => {
  if (!compiler.cache) {
    compiler.cache = {};
    compiler.compileFile = atomatic.compileFile.bind(atomatic);
    compiler.compiledAtomaticFiles = [...atomatic.getCollectedFiles
      .call(atomatic)
      .values()];
  }

  return {
    name: 'atomatic',
    resolveId: async id => {
      const test = await compiler.compiledAtomaticFiles;
      if (test.find(({componentName}) => componentName === id) !== undefined) {
        return `${id}.vue.js`;
      }
    },
    load: async id => {
      if (id.indexOf('/') !== -1) {
        return null;
      }

      const
        test = await compiler.compiledAtomaticFiles,
        file = test.find(({componentName}) => componentName === `${path.basename(id, path.extname(id))}`);

      if (file !== undefined) {
        try {
          return compiler.compileAtomaticFile(Object.assign({file}, options));
        }
        catch (err) {
          console.log(err);
        }
      }
    }
  };
};

const fs = require('fs');
const objectHash = require('object-hash');
const compiler = {};

compiler.replaceFileExtension = (filename, extension) => {
  const i = filename.indexOf('.');
  return `${(i < 0) ? filename : filename.substr(0, i)}.${extension}`;
};

compiler.compileAtomaticFile = async ({file, useMockdata, path, global}) => {
  const {filename, componentName, extension, data, timestamp, saveHtml, renderHook} = file;
  const jsFilename = compiler.replaceFileExtension(filename, 'js');
  const hash = objectHash.MD5([file.componentName, path, useMockdata].join('--'));

  let {cache: {[hash]: {lastCompileTime = 0, script, source = '', locals = ''} = {}}} = compiler;

  if (fs.existsSync(jsFilename) && (!script || fs.statSync(jsFilename).mtimeMs > timestamp - 10000)) {
    script = fs.readFileSync(jsFilename, 'utf8');
  }

  if (lastCompileTime < timestamp) {
    ({
      source,
      locals
    } = await compiler.compileFile({
      filename,
      componentName,
      extension,
      data,
      hash,
      timestamp,
      saveHtml,
      renderHook,
      saveLocals: null
    }, global, false));
  }

  compiler.cache[hash] = {
    source,
    locals,
    script,
    lastCompileTime: timestamp
  };

  return [
    `const __template = ${JSON.stringify(source)};`,
    `const __mockData = ${JSON.stringify(useMockdata ? locals : {})};`,
    script || '',
    `export { __template as template, __mockData as mockData };`
  ].join('\n');
};

module.exports = compiler;

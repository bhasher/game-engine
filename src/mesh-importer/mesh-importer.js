const fs = require('fs');
const objParser = require('./obj-parser');

console.log("Searching for obj files..");

const objDir = './src/assets/obj';

fs.readdir(objDir, (err, files) => {
  if (err) {
    console.error(err);
  }
  files.forEach(file => {
    var objFile = fs.readFileSync(`${objDir}/${file}`, 'utf-8');
    var mesh = objParser.parseObjFile(objFile);
    fs.writeFileSync(`./src/assets/mesh/${file.replace('.obj', '.json')}`, JSON.stringify(mesh));
  });
});
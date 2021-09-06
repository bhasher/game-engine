module.exports = {
  parseObjFile: function (objFile) {
    
    var data = {
      v: [],
      vt: [],
      vn: [],
      f: []
    }

    objFile.split(/\r?\n/).forEach(function(line) {
      const lineType = line.substring(0,2);
      const splitStr = line.split(' ');
      switch (lineType) {
        case 'v ':
          data.v.push([
            new Number(splitStr[1]), 
            new Number(splitStr[2]), 
            new Number(splitStr[3])
          ]);
          break;
        case 'vt':
          data.vt.push([
            new Number(splitStr[1]),
            1 - new Number(splitStr[2])
          ]);
          break;
        case 'vn':
          data.vn.push([
            new Number(splitStr[1]), 
            new Number(splitStr[2]), 
            new Number(splitStr[3])
          ]);
          break;
        case 'f ':
          data.f.push([
            splitStr[1],
            splitStr[2],
            splitStr[3]
          ]);
          break;
      }
    });

    var mesh = {
      position: [],
      uv: [],
      normal: [],
      index: []
    };

    facesHashMap = {};
    var indexCounter = 0;
    var dupeCount = 0;
    data.f.forEach((x, fIndex) => {
      x.forEach(i => {
        if (fIndex==5)
          console.log(i);
        if (facesHashMap[i] == undefined) {
          var splitStr = i.split('/').map(Number);
          var vIndex = splitStr[0] - 1;
          var vtIndex = splitStr[1] - 1;
          var vnIndex = splitStr[2] - 1;
          mesh.position.push(...data.v[vIndex]);
          mesh.uv.push(...data.vt[vtIndex]);
          mesh.normal.push(...data.vn[vnIndex]);
          facesHashMap[i] = indexCounter;
          indexCounter++;
        } else
          dupeCount++;
        mesh.index.push(facesHashMap[i]);
      });
    });

    console.log(mesh.position.length, mesh.uv.length, mesh.normal.length, mesh.index.length);
    console.log('faces', data.f.length);
    console.log('dupe count:', dupeCount);

    console.log(mesh.position.length / 3 * 2)

    /*
    facesHashMap = {};
    var indexCounter = 0;
    var dupeCount = 0;
    data.f.forEach((x, findex) => {
      var line = `${x[0]} ${x[1]} ${x[2]}`;
      if (facesHashMap[line] == undefined) {
        x.forEach(i => {
          var splitStr = i.split('/');
          var vIndex = parseInt(splitStr[0]) - 1;
          var vtIndex = parseInt(splitStr[1]) - 1;
          var vnIndex = parseInt(splitStr[2]) - 1;
          mesh.position.push(...data.v[vIndex]);
          mesh.uv.push(...data.vt[vtIndex]);
          mesh.normal.push(...data.vn[vnIndex]);
        });
        facesHashMap[line] = indexCounter;
        indexCounter++;
      } else {
        dupeCount++;
      }
      mesh.index.push(facesHashMap[line]);
    });

    console.log('dupeCount:', dupeCount);
    */

    return mesh;
  }
}
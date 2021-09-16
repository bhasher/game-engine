const fs = require('fs');

export abstract class MeshRegistery {
  static meshes: Array<Mesh>;

  static loadMeshes(files: Array<string>) {
    files.forEach(file => {
      this.meshes.push(new Mesh(file));
    });
  }

  static getMeshByName(name: string) {
    return this.meshes.filter(x => x.name == name)[0] || null;
  }
}

export class Mesh {
  name: string;
  position: Array<number>;
  normal: Array<number>;
  textureUV: Array<number>;
  indicies: Array<number>;

  constructor(name: string) {
    this.loadFromFile(name);
  }

  get path() {
    return `./dist/assets/mesh/${this.name}.json`;
  }

  loadFromFile(name: string) {
    this.name = name;
    var mesh = JSON.parse(fs.readFileSync(this.path));
    this.position = mesh.position;
    this.normal = mesh.normal;
    this.textureUV = mesh.uv;
    this.indicies = mesh.index;
  }
}
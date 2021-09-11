import { RidgidBody } from './ridgidBody';
import { ForceGenerator } from './forceGenerator';

export class ForceRegistration {
  ridgidBody: RidgidBody;
  forceGenerator: ForceGenerator;

  constructor(object: object) {
    this.ridgidBody = object['ridgidBody'];
    this.forceGenerator = object['forceGenerator'];
  }
}

export class ForceRegistry {
  static registry: Array<ForceRegistration> = [];

  static add(forceRegistration: ForceRegistration) : void {
    if (this.registry.filter(x => x.forceGenerator === forceRegistration.forceGenerator && x.ridgidBody === forceRegistration.ridgidBody).length > 0) {
      throw new Error('Trying to add value to forceRegistry that already exists');
    } else {
      this.registry.push(forceRegistration);
    }
  }

  static remove(forceRegistration: ForceRegistration) : void {
    var filteredResults = this.registry.filter(x => x.forceGenerator !== forceRegistration.forceGenerator && x.ridgidBody !== forceRegistration.ridgidBody);
    if (filteredResults.length === this.registry.length) {
      throw new Error('Cannot find forceRegistation to remove from forceRegistry');
    } else {
      this.registry = filteredResults;
    }
  }

  static update(time: number) {
    this.registry.forEach(x => {
      x.forceGenerator.update(x.ridgidBody, time);
    })
  }
}
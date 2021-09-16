class Input {
  constructor() {
    const canvas = document.querySelector("#glCanvas");
    
    this.bStealingMouse = true;

    this.keybindings = [
      { name: 'forward', key: 'w' },
      { name: 'back', key: 's' },
      { name: 'left', key: 'a' },
      { name: 'right', key: 'd' },
      { name: 'jump', key: ' ' }
    ].map(x => {
      x.isDown = false;
      x.value = 0;
      x.pressed = false;
      x.released = false;
      return x;
    });

    var mouseX = 0;
    this.getMouseX = () => {
      var val = 0;
      if (this.bStealingMouse)
        val = -mouseX;
      mouseX = 0;
      return val;
    }

    var mouseY = 0;
    this.getMouseY = () => {
      var val = 0;
      if (this.bStealingMouse)
        val = -mouseY;
      mouseY = 0;
      return val;
    }

    this.paused = false;
    this.getBindingByKey = val => {
      return this.keybindings.filter(x=>x.key==val)[0];
    }
    this.getBindingByName = val => {
      return this.keybindings.filter(x=>x.name==val)[0];
    }
    this.handleKeyDownEvent = (event) => {
      var keybinding = this.getBindingByKey(event.key);
      if (keybinding) {
        keybinding.isDown = true;
        keybinding.pressed = true;
        keybinding.released = false;
      }
    }
    this.handleKeyUpEvent = event => {
      var keybinding = this.getBindingByKey(event.key);
      if (keybinding) {
        keybinding.isDown = false;
        keybinding.pressed = false;
        keybinding.released = true;
      }
    }
    this.handleClick = event => {
      this.bStealingMouse = (event.target.id === 'glCanvas') ? !this.bStealingMouse : false;
      this.bStealingMouse ? canvas.requestPointerLock() : document.exitPointerLock();
    }
    this.handleMouseMove = event => {
      mouseX += event.movementX;
      mouseY += event.movementY;
    }
    this.flush = () => {
      this.keybindings.forEach(x => {
        x.pressed = false;
      });
    }
    this.pause = () => {
      this.paused = true;
      this.keybindings.forEach(x => {
        x.pressed = false;
        x.isDown = false;
      });
    }
    this.resume = () => {
      this.paused = false;
    }
    document.addEventListener('keydown', this.handleKeyDownEvent);
    document.addEventListener('keyup', this.handleKeyUpEvent);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('mousemove', this.handleMouseMove);
  }
};

module.exports = new Input();
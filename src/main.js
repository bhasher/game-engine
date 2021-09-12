/*
const electron = require('electron');

const { app } = electron;
const { BrowserWindow } = electron;
const { screen } = electron;
const { globalShortcut } = electron;

*/

const { app, BrowserWindow, screen, globalShortcut, ipc } = require('electron');

/** @type {Boolean} */
const test = process.argv.includes('--test');

app.whenReady().then(()=> {

  const {width, height} = screen.getPrimaryDisplay().workAreaSize;

  const windowTemplate = (test) => {
    return {
      title: "The Scarlett Engine",
      width: test ? width : 1400,
      height: test ? height : 600,
      frame: !test,
      fullscreenable: true,
      fullscreen: test,
      webPreferences: {
        nodeIntegration: true
        //nodeIntegrationInWorker: true
      },
    } 
  }

  /** @type {BrowserWindow} */
  const window = new BrowserWindow(windowTemplate(test));

  if (!test)
    window.webContents.openDevTools();

  window.loadFile('./dist/index.html');

  globalShortcut.register('Esc', () => {
    app.quit();
  });

  globalShortcut.register('F5', () => {
    window.webContents.reload();
  });

  globalShortcut.register('F4', () => {
    window.webContents.send('pause', null);
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
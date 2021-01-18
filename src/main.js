/*
const electron = require('electron');

const { app } = electron;
const { BrowserWindow } = electron;
const { screen } = electron;
const { globalShortcut } = electron;

*/

const { app, BrowserWindow, screen, globalShortcut } = require('electron');

/** @type {Boolean} */
const test = process.argv.includes('--test');

app.whenReady().then(()=> {

  const {width, height} = screen.getPrimaryDisplay().workAreaSize;

  const windowTemplate = (test) => {
    return {
      width: test ? width : 1400,
      height: test ? height : 600,
      frame: false,
      fullscreenable: test,
      fullscreen: test,
      webPreferences: {
        nodeIntegration: true
      }
    } 
  }

  /** @type {BrowserWindow} */
  const window = new BrowserWindow(windowTemplate(test));

  if (!test)
    window.webContents.openDevTools();

  window.loadFile('src/app/index.html')

  globalShortcut.register('Esc', () => {
    app.quit();
  });

  globalShortcut.register('F5', () => {
    window.webContents.reload();
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
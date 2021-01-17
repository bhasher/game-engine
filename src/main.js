const { app, BrowserWindow, Menu, ipcMain, protocol, Notification, screen, globalShortcut } = require('electron')

app.whenReady().then(()=> {
  const {width, height} = screen.getPrimaryDisplay().workAreaSize;

  /** @type {BrowserWindow} */
  const window = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    titleBarStyle: 'hidden',
    fullscreenable: true,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

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
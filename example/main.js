const electron = require('electron');
const { app, BrowserWindow, globalShortcut, ipcMain } = electron;
const path = require('path');
let win;

function addFindSupport(window) {
	window.on("focus", () => {
		globalShortcut.register("CommandOrControl+F", () => {
			window.webContents.send("openFind");
		})
	})
	window.on("blur", () => {
		globalShortcut.unregister("CommandOrControl+F");
	});

	window.findListener = (event, text, options) => { window.webContents.findInPage(text, options); };
	window.stopFindListener = (event, action) => { window.webContents.stopFindInPage(action); };
	ipcMain.on("find", window.findListener);
	ipcMain.on("stopFind", window.stopFindListener);
	window.webContents.on("found-in-page", (event, result) => { window.webContents.send("found-in-page", result); });

	window.on("closed", () => {
		globalShortcut.unregister("CommandOrControl+F");
		ipcMain.removeListener("find", window.findListener);
		ipcMain.removeListener("stopFind", window.stopFindListener);
	});
}

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    center: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
    }
  })
  addFindSupport(win);
  win.loadURL('file://' + path.normalize(`${__dirname}/example.html`));
  win.on('closed', () => {
    win = null;
  });

  win.on('focus', () => {
    globalShortcut.register('CommandOrControl+F', function () {
      if (win && win.webContents) {
        win.webContents.send('openFind', '');
      }
    });
  });
  win.on('blur', () => {
    globalShortcut.unregister('CommandOrControl+F');
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  globalShortcut.unregister('CommandOrControl+F');
});
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

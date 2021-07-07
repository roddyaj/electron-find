const { FindInPage } = require('../src/index.js');
const ipcRenderer = require('electron').ipcRenderer;

const findInPage = new FindInPage(ipcRenderer);
ipcRenderer.on("openFind", (_event, _message) => {
  findInPage.openFindWindow();
});

const { app, BrowserWindow } = require('electron');

function createWindow() {
    let win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadURL('http://127.0.0.1:5500/Index.html#issue-form');
}

app.whenReady().then(createWindow);

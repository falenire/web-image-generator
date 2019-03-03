const electron = require("electron")
const { app, BrowserWindow, globalShortcut } = electron

let mainWindow;
const windowSize = {
  width: 600, 
  height: 400,
  backgroundColor:"#ffffff",
}

const showDevTools = (window) => {
  window.webContents.openDevTools();
}

/*
 * Windows
 */
app.on("ready", () => {
  globalShortcut.register("CommandOrControl+D+T", ()=>{
    showDevTools(mainWindow)
  })
  console.log(globalShortcut.isRegistered("CommandOrControl+D+T"))
  mainWindow = new BrowserWindow(windowSize)
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '/build/index.html'),
    protocol: 'file:',
    slashes: true
  })
  mainWindow.loadURL(startUrl)
})

/*
 * Handle closing the application
 */
app.on("window-all-closed", app.quit)
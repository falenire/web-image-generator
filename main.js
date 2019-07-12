const electron = require("electron")
const { app, BrowserWindow, globalShortcut, url } = electron
// const gm = require('gm')

// exports.gm = gm

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
  globalShortcut.register("CommandOrControl+Shift+Alt+T", ()=>{
    showDevTools(mainWindow)
  })
  console.log(globalShortcut.isRegistered("CommandOrControl+Shift+Alt+T"))
  mainWindow = new BrowserWindow(windowSize)
  const startUrl = process.env.ELECTRON_START_URL || `file://${__dirname}/build/index.html`;
  mainWindow.loadURL(startUrl)
  // mainWindow.webContents.openDevTools();
})

/*
 * Handle closing the application
 */
app.on("window-all-closed", app.quit)

exports.isPackaged = app.isPackaged;
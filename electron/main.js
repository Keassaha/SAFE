const { app, BrowserWindow } = require("electron")
const http = require("http")

const DEV_ORIGIN = "http://127.0.0.1:3001"

function waitForNextDevServer(callback) {
  const tryOnce = () => {
    const req = http.get(`${DEV_ORIGIN}/`, (res) => {
      res.resume()
      if (res.statusCode && res.statusCode < 500) {
        callback()
        return
      }
      setTimeout(tryOnce, 400)
    })
    req.on("error", () => setTimeout(tryOnce, 400))
    req.setTimeout(2500, () => {
      req.destroy()
      setTimeout(tryOnce, 400)
    })
  }
  tryOnce()
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadURL(DEV_ORIGIN)
}

app.whenReady().then(() => {
  waitForNextDevServer(createWindow)
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

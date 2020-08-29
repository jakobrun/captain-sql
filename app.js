const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const fs = require('fs')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = []

global.sharedObject = {
    dev: process.argv.find(arg => arg === 'dev=true'),
}
ipcMain.handle('get-app-data-path', () => app.getPath('appData'))
ipcMain.handle('read-app-data-file', async (_, fileName) => {
    const buf = await fs.promises.readFile(
        path.join(app.getPath('appData'), fileName)
    )
    return buf.toString('utf8')
})
ipcMain.handle('write-app-data-file', async (_, fileName, content) => {
    await fs.promises.writeFile(
        path.join(app.getPath('appData'), fileName),
        content
    )
})

function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'icons/png/64x64.png'),
        webPreferences: {
            nodeIntegration: true,
        },
    })

    // and load the index.html of the app.
    win.loadURL(
        url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        })
    )

    // Open the DevTools.
    if (process.argv.find(arg => arg === 'dev-tools=true')) {
        win.webContents.openDevTools()
    }

    // Emitted when the window is closed.
    win.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows = windows.filter(w => w !== win)
    })

    windows.push(win)
}

function createMenu() {
    const template = [
        {
            label: 'Application',
            submenu: [
                {
                    label: 'About Application',
                    selector: 'orderFrontStandardAboutPanel:',
                },
                { type: 'separator' },
                { role: 'close' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function() {
                        app.quit()
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    role: 'undo',
                },
                {
                    role: 'redo',
                },
                { type: 'separator' },
                { role: 'cut' },
                {
                    role: 'copy',
                },
                {
                    role: 'paste',
                },
                {
                    role: 'selectAll',
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                {
                    role: 'togglefullscreen',
                },
                {
                    role: 'resetzoom',
                },
                {
                    role: 'zoomin',
                },
                {
                    role: 'zoomout',
                },
            ],
        },
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow()
    createMenu()
})

ipcMain.on('new-window', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!windows.length) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

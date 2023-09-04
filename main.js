const path = require('path');
const {app, BrowserWindow, Menu,dialog,ipcMain} = require('electron');
const {encoder, killTranscodingProcess} = require('./transcoder');
const isMac = process.platform === 'darwin';
// const isDev = process.env.NODE_ENV !== 'development';
const isDev = false;

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'HLS Studio',
        width: isDev ? 2000 : 1065,
        height: 700,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname,'preload.js'),
            // nodeIntegration: true,
            contextIsolation: true,
            worldSafeExecuteJavaScript: true,
        }
    });
    // Open devtools in dev mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
        // Create an empty menu to replace the default menu
    const emptyMenu = Menu.buildFromTemplate([]);
    Menu.setApplicationMenu(emptyMenu);

    ipcMain.handle('dialog:openDirectory', async () => {
        let options = {
            buttonLabel: 'Export Here',
            title : "Select Output Folder",
            properties: ['openDirectory'],
        }
     
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options)
        if (canceled) {
          return
        } else {
          return filePaths[0]
        }
    })

    ipcMain.handle('start-vide-encoder', async (event, argv) => {
        const output = encoder(argv, (out)=>{
            event.sender.send('encoder-output', out);
        })
        return true;
    })
    ipcMain.on('kill-transcoding-process', () => {
        // Call a function in your transcoder module to kill the process
        killTranscodingProcess();
      });
    
}


app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
    
});

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
})



//TODO
// resolve weird error on file box
// check movie file gets selected or not
//Failed message
//Folder selection box resize and bring to front
//Move font locally
//Create project readme
//Windows,Linux and Mac packaging
//Trial functionality
//Logging to a file.log (autocleanup) [OPTIONAL]
//Key mechanism

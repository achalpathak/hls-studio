const {contextBridge,ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    node: () => process.versions.node,
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    startEncoder: (argv, callback) => {
        // Send the argv object to the main process
        ipcRenderer.invoke('start-vide-encoder', argv);

        // Listen for real-time output data from the main process
        ipcRenderer.on('encoder-output', (event, outputData) => {
            callback(outputData);
        });
    },
    killTranscodingProcess: () => {
        ipcRenderer.send('kill-transcoding-process'); // Send the signal to kill the process
      },
});
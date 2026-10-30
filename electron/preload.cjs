const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUndo: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('app-undo', handler);
    return () => ipcRenderer.removeListener('app-undo', handler);
  },
  onRedo: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('app-redo', handler);
    return () => ipcRenderer.removeListener('app-redo', handler);
  },
});

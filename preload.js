// Exposes the native save dialog to the page as window.desktop.saveFile
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  saveFile: (filename, data) => ipcRenderer.invoke("save-file", { filename, data }),
});

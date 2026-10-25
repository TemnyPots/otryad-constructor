// Desktop shell: one window with the constructor page, native "Save as" for Excel and project files.
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs/promises");

const FILTERS = {
  xlsx: [{ name: "Книга Excel", extensions: ["xlsx"] }],
  json: [{ name: "Проект конструктора", extensions: ["json"] }],
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 420,
    title: "Отрядный конструктор",
    backgroundColor: "#EEF2EE",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // links to other sites open in the system browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.loadFile(path.join(__dirname, "app", "index.html"));
}

ipcMain.handle("save-file", async (event, { filename, data }) => {
  const ext = path.extname(filename).slice(1).toLowerCase();
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: path.join(app.getPath("documents"), filename),
    filters: FILTERS[ext] || [],
  });
  if (canceled || !filePath) return { status: "declined" };
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  await fs.writeFile(filePath, buf);
  return { status: "saved", path: filePath };
});

const isMac = process.platform === "darwin";
Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    // macOS takes the first menu as the app menu
    ...(isMac ? [{ role: "appMenu", label: "Отрядный конструктор" }] : []),
    {
      label: "Файл",
      submenu: [{ role: "reload", label: "Обновить окно" }, ...(isMac ? [] : [{ type: "separator" }, { role: "quit", label: "Выход" }])],
    },
    {
      // without these roles Cmd+C / Cmd+V do nothing in text fields on macOS
      label: "Правка",
      submenu: [
        { role: "undo", label: "Отменить" },
        { role: "redo", label: "Повторить" },
        { type: "separator" },
        { role: "cut", label: "Вырезать" },
        { role: "copy", label: "Копировать" },
        { role: "paste", label: "Вставить" },
        { role: "selectAll", label: "Выделить всё" },
      ],
    },
    {
      label: "Вид",
      submenu: [
        { role: "zoomIn", label: "Крупнее" },
        { role: "zoomOut", label: "Мельче" },
        { role: "resetZoom", label: "Обычный размер" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Во весь экран" },
        { role: "toggleDevTools", label: "Инструменты разработчика" },
      ],
    },
  ])
);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

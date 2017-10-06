'use strict'
const { app, BrowserWindow, dialog } = require('electron')

const createWindow = (file) => {
  let newWindow = new BrowserWindow({show: false, fullscreen: false, minWidth: 1024, minHeight: 600})
  newWindow.once('ready-to-show', (event) => {
    newWindow.show()
  })

  newWindow.on('close', (event) => {
    if (newWindow.isDocumentEdited()) {
      event.preventDefault()
      let result = dialog.showMessageBox(newWindow, {
        type: 'warning',
        title: 'Quit with unsaved changes?',
        message: 'Your changes will be lost if you do not save first.',
        buttons: ['Quit Anyway', 'Cancel'],
        defaultId: 0,
        cancelId: 1
      })

      if (result === 0) {
        newWindow.destroy()
      }
    }
  })

  newWindow.on('closed', (event) => {
    newWindow = null
  })

  newWindow.loadURL(`file://${__dirname}/index.html`)
  return newWindow
}

app.on('ready', () => {
  createWindow()
})

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    obtenerJuegos: () => ipcRenderer.invoke('obtener-juegos'),

    seleccionarEjecutable: () => ipcRenderer.invoke('seleccionar-ejecutable'),

    seleccionarPortada: () => ipcRenderer.invoke('seleccionar-portada'),

    guardarJuego: (juego) => ipcRenderer.invoke('guardar-juego', juego),

    editarJuego: (juego) => ipcRenderer.invoke('editar-juego', juego),

    eliminarJuego: (id) => ipcRenderer.invoke('eliminar-juego', id),

    abrirJuego: (datos) => ipcRenderer.invoke('abrir-juego', datos),
    
    onJuegoTerminado: (callback) => ipcRenderer.on('juego-terminado', callback)
});
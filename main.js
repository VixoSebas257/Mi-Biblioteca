const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const rutaDatos = path.join(app.getPath('userData'), 'data');
const rutaJuegos = path.join(rutaDatos, 'juegos.json');
const rutaCovers = path.join(rutaDatos, 'covers');

let juegoAbierto = null;
let juegoAbiertoId = null;

function createWindow() {
    const win = new BrowserWindow({
    width: 1300,
    height: 700,
    title: 'Mi Biblioteca',
    icon: path.join(__dirname, 'icon.ico'),

    webPreferences: {
        preload: path.join(__dirname, 'preload.js')
    }
});

    win.loadFile('src/index.html');
}

ipcMain.handle('obtener-juegos', () => {

    const carpetaAntigua = path.join(__dirname, 'data');
    const juegosAntiguos = path.join(carpetaAntigua, 'juegos.json');
    const coversAntiguos = path.join(__dirname, 'covers');

    // Crear las carpetas nuevas
    fs.mkdirSync(rutaDatos, { recursive: true });
    fs.mkdirSync(rutaCovers, { recursive: true });

    // Comprobar si existe la biblioteca antigua
    if (fs.existsSync(juegosAntiguos)) {

        const datosAntiguos = fs.readFileSync(
            juegosAntiguos,
            'utf-8'
        );

        const juegosAntiguosJSON = JSON.parse(datosAntiguos);

        // Leer la biblioteca nueva si existe
        let juegosNuevos = [];

        if (fs.existsSync(rutaJuegos)) {

            const datosNuevos = fs.readFileSync(
                rutaJuegos,
                'utf-8'
            );

            juegosNuevos = JSON.parse(datosNuevos);
        }

        // Si la biblioteca nueva está vacía,
        // recuperar la biblioteca antigua
        if (juegosNuevos.length === 0 && juegosAntiguosJSON.length > 0) {

            fs.copyFileSync(
                juegosAntiguos,
                rutaJuegos
            );

            // Copiar las portadas antiguas
            if (fs.existsSync(coversAntiguos)) {

                const archivos = fs.readdirSync(coversAntiguos);

                archivos.forEach(archivo => {

                    const origen = path.join(coversAntiguos, archivo);
                    const destino = path.join(rutaCovers, archivo);

                    if (fs.statSync(origen).isFile()) {
                        fs.copyFileSync(origen, destino);
                    }

                });
            }
        }

    } else {

        // Si no existe ninguna biblioteca, crear una vacía
        if (!fs.existsSync(rutaJuegos)) {

            fs.writeFileSync(
                rutaJuegos,
                '[]',
                'utf-8'
            );
        }
    }

    // Leer la biblioteca finalmente utilizada
    const datos = fs.readFileSync(
        rutaJuegos,
        'utf-8'
    );

    const juegos = JSON.parse(datos);

    // Convertir las portadas a rutas que Electron pueda mostrar
    return juegos.map(juego => {

        const nombreImagen = path.basename(juego.imagen);

        return {
            ...juego,
            imagen: `file://${path.join(rutaCovers, nombreImagen).replace(/\\/g, '/')}`
        };

    });
});

ipcMain.handle('seleccionar-ejecutable', async () => {

    const resultado = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {
                name: 'Ejecutables',
                extensions: ['exe']
            }
        ]
    });

    if (resultado.canceled) {
        return null;
    }

    const ruta = resultado.filePaths[0];

    const nombreArchivo = path.basename(ruta);
    const nombreJuego = path.parse(nombreArchivo).name;

    return {
        ruta: ruta,
        nombre: nombreJuego
    };
});
ipcMain.handle('seleccionar-portada', async () => {

    const resultado = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {
                name: 'Imágenes',
                extensions: ['jpg', 'jpeg', 'png', 'webp']
            }
        ]
    });

    if (resultado.canceled) return null;

    const rutaOriginal = resultado.filePaths[0];
    const nombreArchivo = path.basename(rutaOriginal);

    // Crear carpeta de portadas si no existe
    fs.mkdirSync(rutaCovers, { recursive: true });

    const rutaDestino = path.join(rutaCovers, nombreArchivo);

    fs.copyFileSync(rutaOriginal, rutaDestino);

    return rutaDestino;
});
ipcMain.handle('guardar-juego', (event, juego) => {

    const ruta = rutaJuegos;
    const datos = fs.readFileSync(ruta, 'utf-8');

    const juegos = JSON.parse(datos);

    const nuevoId = juegos.length > 0
        ? Math.max(...juegos.map(juego => juego.id)) + 1
        : 1;

    const nombreImagen = path.basename(juego.portada);

    const nuevoJuego = {
        id: nuevoId,
        nombre: juego.nombre,
        ejecutable: juego.ejecutable,
        imagen: "../covers/" + nombreImagen
    };

    juegos.push(nuevoJuego);

    fs.writeFileSync(
        ruta,
        JSON.stringify(juegos, null, 4),
        'utf-8'
    );

    return nuevoJuego;
});
ipcMain.handle('editar-juego', (event, juego) => {

    const ruta = rutaJuegos;

    const datos = fs.readFileSync(ruta, 'utf-8');

    const juegos = JSON.parse(datos);

    const indice = juegos.findIndex(item => item.id === juego.id);

    if (indice === -1) {
        return null;
    }

    const juegoActual = juegos[indice];

    const nuevoJuego = {
        id: juego.id,
        nombre: juego.nombre,
        ejecutable: juego.ejecutable,
        imagen: juego.portada
            ? "../covers/" + path.basename(juego.portada)
            : juegoActual.imagen
    };

    juegos[indice] = nuevoJuego;

    fs.writeFileSync(
        ruta,
        JSON.stringify(juegos, null, 4),
        'utf-8'
    );

    return nuevoJuego;
});
ipcMain.handle('eliminar-juego', (event, id) => {

    const ruta = rutaJuegos;
    const datos = fs.readFileSync(ruta, 'utf-8');

    const juegos = JSON.parse(datos);

    const juegosRestantes = juegos.filter(juego => juego.id !== id);

    fs.writeFileSync(
        ruta,
        JSON.stringify(juegosRestantes, null, 4),
        'utf-8'
    );

    return true;
});
ipcMain.handle('abrir-juego', (event, datos) => {

    // Si ya hay un juego abierto, no hacemos nada
    if (juegoAbierto !== null) {
        return false;
    }

    const proceso = execFile(datos.ruta, (error) => {

        if (error) {
            console.error("No se pudo abrir el juego:", error);
        }

        juegoAbierto = null;
        juegoAbiertoId = null;

        event.sender.send('juego-terminado');
    });

    juegoAbierto = proceso;
    juegoAbiertoId = datos.id;

    return true;
});

app.whenReady().then(() => {
    createWindow();
});
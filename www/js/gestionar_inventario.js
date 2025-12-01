document.addEventListener('deviceready', onDeviceReadyGestionarInventario, false);

// URL del Google Apps Script para manejo de inventario
// Importante: Reemplazar con la URL real de tu despliegue de Google Apps Script
// Para desplegar:
// 1. Ir a script.google.com y crear un nuevo proyecto
// 2. Pegar el contenido del archivo google-sheets-inventario.gs
// 3. Ir a "Deploy" > "New deployment"
// 4. Seleccionar "Web app" como tipo de despliegue
// 5. Configurar como:
//    - "Execute as": Me (o cualquiera)
//    - "Who has access": Anyone (u opcionalmente "Anyone with Google account")
// 6. Hacer click en "Deploy" y copiar la URL generada
// Ejemplo: 'https://script.google.com/macros/s/abcdefghijklmnopqrstuvwxyz/exec'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYyXpBj_sVhVggTTC5J3zi2k416rg0dgv7_7jGmn0a8mQTApHVLH5lBOBm9RHfLYTT/exec';

function onDeviceReadyGestionarInventario() {
    console.log('Running cordova for gestionar_inventario.html');
    if (!localStorage.getItem('currentUser')) {
        window.location.href = "index.html";
    }
    // Se moverá la llamada a cargarGestionarInventarioPage para asegurar que los datos estén listos.
}

// Inicializar productos desde Google Sheets en lugar de localStorage
let gestionarProductosDisponibles = [];

// Función para insertar un producto en Google Sheets
function insertarProductoEnSheet(producto) {
    return new Promise((resolve, reject) => {
        const parametros = {
            action: 'insert',
            nombre: producto.nombre,
            precioUSD: producto.precioUSD,
            inventario: producto.inventario,
            categoria: producto.categoria,
            fotoBase64: producto.fotoBase64,
            idProducto: producto.id
        };

        const url = `${GOOGLE_SCRIPT_URL}?${Object.keys(parametros).map(key =>
            encodeURIComponent(key) + '=' + encodeURIComponent(parametros[key])).join('&')}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status) {
                    console.log('Producto insertado exitosamente en Google Sheets');
                    resolve(data);
                } else {
                    console.error('Error al insertar producto:', data.message);
                    reject(data.message);
                }
            })
            .catch(error => {
                console.error('Error en la solicitud a Google Sheets:', error);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    reject('Error de conexión: Verifique su conexión a internet y la URL del Google Apps Script');
                } else if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                    reject('No se pudo conectar con Google Sheets: Verifique que el despliegue del Google Apps Script sea correcto');
                } else {
                    reject(error.message);
                }
            });
    });
}

// Función para obtener todos los productos de Google Sheets
function obtenerProductosDeSheet() {
    return new Promise((resolve, reject) => {
        const parametros = {
            action: 'readAll'
        };

        const url = `${GOOGLE_SCRIPT_URL}?${Object.keys(parametros).map(key =>
            encodeURIComponent(key) + '=' + encodeURIComponent(parametros[key])).join('&')}`;

        fetch(url)
            .then(response => {
                // Verificar si la respuesta es exitosa antes de intentar leer JSON
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status) {
                    console.log('Productos obtenidos exitosamente de Google Sheets');
                    resolve(data.records);
                } else {
                    console.error('Error al obtener productos:', data.message);
                    reject(data.message);
                }
            })
            .catch(error => {
                console.error('Error en la solicitud a Google Sheets:', error);
                // Proporcionar un mensaje más descriptivo para diferentes tipos de error
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    reject('Error de conexión: Verifique su conexión a internet y la URL del Google Apps Script');
                } else if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                    reject('No se pudo conectar con Google Sheets: Verifique que el despliegue del Google Apps Script sea correcto');
                } else {
                    reject(error.message);
                }
            });
    });
}

// Función para actualizar un producto en Google Sheets
function actualizarProductoEnSheet(idProducto, productoActualizado) {
    return new Promise((resolve, reject) => {
        const parametros = {
            action: 'update',
            idProducto: idProducto,
            nombre: productoActualizado.nombre,
            precioUSD: productoActualizado.precioUSD,
            inventario: productoActualizado.inventario,
            categoria: productoActualizado.categoria,
            fotoBase64: productoActualizado.fotoBase64
        };

        const url = `${GOOGLE_SCRIPT_URL}?${Object.keys(parametros).map(key =>
            encodeURIComponent(key) + '=' + encodeURIComponent(parametros[key])).join('&')}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status) {
                    console.log('Producto actualizado exitosamente en Google Sheets');
                    resolve(data);
                } else {
                    console.error('Error al actualizar producto:', data.message);
                    reject(data.message);
                }
            })
            .catch(error => {
                console.error('Error en la solicitud a Google Sheets:', error);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    reject('Error de conexión: Verifique su conexión a internet y la URL del Google Apps Script');
                } else if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                    reject('No se pudo conectar con Google Sheets: Verifique que el despliegue del Google Apps Script sea correcto');
                } else {
                    reject(error.message);
                }
            });
    });
}

// Función para eliminar un producto de Google Sheets
function eliminarProductoDeSheet(idProducto) {
    return new Promise((resolve, reject) => {
        const parametros = {
            action: 'delete',
            idProducto: idProducto
        };

        const url = `${GOOGLE_SCRIPT_URL}?${Object.keys(parametros).map(key =>
            encodeURIComponent(key) + '=' + encodeURIComponent(parametros[key])).join('&')}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status) {
                    console.log('Producto eliminado exitosamente de Google Sheets');
                    resolve(data);
                } else {
                    console.error('Error al eliminar producto:', data.message);
                    reject(data.message);
                }
            })
            .catch(error => {
                console.error('Error en la solicitud a Google Sheets:', error);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    reject('Error de conexión: Verifique su conexión a internet y la URL del Google Apps Script');
                } else if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                    reject('No se pudo conectar con Google Sheets: Verifique que el despliegue del Google Apps Script sea correcto');
                } else {
                    reject(error.message);
                }
            });
    });
}

// Llamar a cargarGestionarInventarioPage después de que el DOM esté completamente cargado
// y después de que gestionarProductosDisponibles se haya inicializado.
// El evento 'deviceready' es bueno, pero para asegurar que los elementos del DOM
// y las variables globales estén listas, podemos también usar DOMContentLoaded o simplemente llamar
// la función después de definir las variables si el script está al final del body.
// Dado que ya está en onDeviceReady, nos aseguraremos que la variable esté poblada antes de llamar.

document.addEventListener('DOMContentLoaded', () => {
    // Asegurarse de que la lista se cargue después de que el DOM esté listo y las variables definidas.
    // La llamada original en onDeviceReadyGestionarInventario también es válida si el script está al final.
    // Para ser explícito y cubrir casos donde el script podría no estar al final:
    if (typeof cargarGestionarInventarioPage === "function") {
        cargarGestionarInventarioPage();
    }
});


const listaGestionarInventarioDivPage = document.getElementById('lista-gestionar-inventario');
const editProductoIdInputPage = document.getElementById('edit-producto-id');
const gestionarNombreProductoInputPage = document.getElementById('gestionar-nombre-producto');
const gestionarPrecioProductoInputPage = document.getElementById('gestionar-precio-producto');
const gestionarStockProductoInputPage = document.getElementById('gestionar-stock-producto');
const gestionarFotoProductoInputPage = document.getElementById('gestionar-foto-producto'); // Nuevo input de foto
const fotoPreviewPage = document.getElementById('foto-preview'); // Nuevo preview de imagen
const guardarProductoButtonPage = document.getElementById('guardar-producto-button');
const cancelarEdicionProductoButtonPage = document.getElementById('cancelar-edicion-producto-button');
const agregarCategoriaButton = document.getElementById('agregar-categoria-button');
const eliminarCategoriaButton = document.getElementById('eliminar-categoria-button');
// const volverMenuGestionarButtonPage = document.getElementById('volver-menu-gestionar-button'); // Botón eliminado

function cargarGestionarInventarioPage() {
    // Cargar categorías desde localStorage
    let categorias = JSON.parse(localStorage.getItem('categorias')) || [];
    const categoriaSelect = document.getElementById('gestionar-categoria-producto');

    // Limpiar opciones existentes
    categoriaSelect.innerHTML = '';

    // Agregar la opción por defecto
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona una categoría';
    categoriaSelect.appendChild(defaultOption);

    // Agregar las opciones de categoría
    categorias.forEach(categoria => {
        let option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoriaSelect.appendChild(option);
    });

    if (agregarCategoriaButton) {
        agregarCategoriaButton.addEventListener('click', () => {
            Swal.fire({
                title: 'Agregar Categoría',
                input: 'text',
                inputPlaceholder: 'Ingrese el nombre de la categoría',
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#20429a',
                preConfirm: (value) => {
                    if (!value) {
                        Swal.showValidationMessage('Debes ingresar un nombre para la categoría.');
                        return false;
                    }
                    if (categorias.includes(value)) {
                        Swal.showValidationMessage('Esta categoría ya existe.');
                        return false;
                    }
                    return value;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    categorias.push(result.value);
                    localStorage.setItem('categorias', JSON.stringify(categorias));
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Categoría agregada correctamente.',
                        confirmButtonColor: '#20429a',
                        confirmButtonText: "Aceptar"
                    });
                    // Actualizar el input de categoría (opcional, si es un select)
                    cargarGestionarInventarioPage();
                }
            });
        });
    }

    if (eliminarCategoriaButton) {
        eliminarCategoriaButton.addEventListener('click', () => {
            // Implementar lógica para eliminar categoría (usando Swal para confirmar)
            Swal.fire({
                title: 'Eliminar Categoría',
                text: '¿Estás seguro de que deseas eliminar la categoría seleccionada?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Lógica para eliminar la categoría
                    let categorias = JSON.parse(localStorage.getItem('categorias')) || [];
                    const categoriaSeleccionada = categoriaSelect.value;
                    if (categoriaSeleccionada) {
                        categorias = categorias.filter(cat => cat !== categoriaSeleccionada);
                        localStorage.setItem('categorias', JSON.stringify(categorias));
                        cargarGestionarInventarioPage();
                        Swal.fire({
                            icon: 'success',
                            title: 'Eliminada',
                            text: 'La categoría ha sido eliminada.',
                            confirmButtonColor: '#20429a',
                            confirmButtonText: "Aceptar"
                        });
                    }
                }
            });
        });
    }

    // Cargar productos desde Google Sheets
    obtenerProductosDeSheet()
        .then(productos => {
            gestionarProductosDisponibles = productos.map(p => ({
                id: p.ID_Producto,
                nombre: p.Nombre_Producto,
                precioUSD: parseFloat(p.Precio_USD),
                inventario: parseInt(p.Stock),
                categoria: p.Categor_a, // Nota: Google Sheets reemplaza espacios con guiones bajos
                fotoBase64: p.Foto_Base64
            }));

            renderizarProductos();
        })
        .catch(error => {
            console.error('Error al cargar productos desde Google Sheets:', error);
            // Si falla la carga desde Google Sheets, mostrar un mensaje amigable
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los productos desde Google Sheets. Detalles: ' + error.message,
                confirmButtonColor: '#20429a'
            });
        });
}

function renderizarProductos() {
    const listaGestionarInventarioDivPage = document.getElementById('lista-gestionar-inventario');
    if (!listaGestionarInventarioDivPage) return;
    listaGestionarInventarioDivPage.innerHTML = ''; // Clear previous content

    const h3 = document.createElement('h3');
    // h3.textContent = 'Productos para Gestionar'; // Already in HTML
    // listaGestionarInventarioDivPage.appendChild(h3);

    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';

    if (gestionarProductosDisponibles.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay productos para gestionar.';
        ul.appendChild(li);
    } else {
        gestionarProductosDisponibles.forEach(p => {
            const li = document.createElement('li');
            li.style.padding = '8px 0';
            li.style.borderBottom = '1px solid #eee';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';

            // Contenedor para imagen y texto
            const infoContainer = document.createElement('div');
            infoContainer.style.display = 'flex';
            infoContainer.style.alignItems = 'center';

            if (p.fotoBase64) {
                const img = document.createElement('img');
                img.src = p.fotoBase64;
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.marginRight = '10px';
                img.style.objectFit = 'cover';
                infoContainer.appendChild(img);
            }

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('producto-info-venta'); // Reutilizar clase de ventas.js

            const nombreSpan = document.createElement('span');
            nombreSpan.classList.add('producto-nombre-venta');
            // Truncar nombre si es más largo de 16 caracteres
            nombreSpan.textContent = p.nombre.length > 16 ? p.nombre.substring(0, 16) + '...' : p.nombre;
            infoDiv.appendChild(nombreSpan);

            const precioSpan = document.createElement('span');
            precioSpan.classList.add('producto-precio-venta');
            precioSpan.textContent = `($${p.precioUSD.toFixed(2)})`;
            infoDiv.appendChild(precioSpan);

            const categoriaSpan = document.createElement('span');
            categoriaSpan.classList.add('producto-categoria-venta');
            categoriaSpan.textContent = ` - Categoría: ${p.categoria}`;
            infoDiv.appendChild(categoriaSpan);

            const stockSpan = document.createElement('span');
            stockSpan.classList.add('producto-stock-venta');
            stockSpan.textContent = ` - Stock: ${p.inventario}`;
            infoDiv.appendChild(stockSpan);

            infoContainer.appendChild(infoDiv);

            li.appendChild(infoContainer);

            const buttonsDiv = document.createElement('div');
            const editButton = document.createElement('button');
            editButton.innerHTML = '✏️'; // Lápiz ✏️ (U+270F)
            editButton.title = 'Editar'; // Tooltip
            editButton.dataset.id = p.id;
            editButton.classList.add('edit-producto-btn', 'icon-button');
            // editButton.style.marginLeft = '10px'; // Estilos ahora en CSS
            // editButton.style.padding = '3px 6px'; // Estilos ahora en CSS
            // editButton.style.fontSize = '0.8em'; // Estilos ahora en CSS
            // editButton.style.backgroundColor = '#ffc107'; // Color ahora en CSS
            editButton.addEventListener('click', () => popularFormularioEdicionProductoPage(p.id));
            buttonsDiv.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '🗑️'; // Papelera 🗑️
            deleteButton.title = 'Eliminar'; // Tooltip
            deleteButton.dataset.id = p.id;
            deleteButton.classList.add('delete-producto-btn', 'icon-button');
            // deleteButton.style.marginLeft = '5px'; // Estilos ahora en CSS
            // deleteButton.style.padding = '3px 6px'; // Estilos ahora en CSS
            // deleteButton.style.fontSize = '0.8em'; // Estilos ahora en CSS
            // deleteButton.style.backgroundColor = '#f44336'; // Color ahora en CSS
            deleteButton.addEventListener('click', () => eliminarProductoPage(p.id));
            buttonsDiv.appendChild(deleteButton);

            li.appendChild(buttonsDiv);
            ul.appendChild(li);
        });
    }
    listaGestionarInventarioDivPage.appendChild(ul);
    limpiarFormularioProductoPage();
}

function popularFormularioEdicionProductoPage(productoId) {
    const producto = gestionarProductosDisponibles.find(p => p.id === productoId);
    if (producto) {
        editProductoIdInputPage.value = producto.id;
        gestionarNombreProductoInputPage.value = producto.nombre;
        gestionarPrecioProductoInputPage.value = producto.precioUSD.toFixed(2);
        gestionarStockProductoInputPage.value = producto.inventario;
        document.getElementById('gestionar-categoria-producto').value = producto.categoria; // Nueva línea
        if (producto.fotoBase64) {
            fotoPreviewPage.src = producto.fotoBase64;
            fotoPreviewPage.style.display = 'block';
        } else {
            fotoPreviewPage.src = '#';
            fotoPreviewPage.style.display = 'none';
        }
        gestionarFotoProductoInputPage.value = ''; // Clear file input
        cancelarEdicionProductoButtonPage.style.display = 'inline-block';
        guardarProductoButtonPage.textContent = 'Actualizar Producto';
    }
}

function limpiarFormularioProductoPage() {
    editProductoIdInputPage.value = '';
    gestionarNombreProductoInputPage.value = '';
    gestionarPrecioProductoInputPage.value = '';
    gestionarStockProductoInputPage.value = '';
    gestionarFotoProductoInputPage.value = ''; // Clear file input
    fotoPreviewPage.src = '#';
    fotoPreviewPage.style.display = 'none';
    cancelarEdicionProductoButtonPage.style.display = 'none';
    guardarProductoButtonPage.textContent = 'Guardar Producto';
}

function eliminarProductoPage(productoId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#20429a',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Eliminar producto de Google Sheets
            eliminarProductoDeSheet(productoId)
                .then(data => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminado',
                        text: 'El producto ha sido eliminado.',
                        confirmButtonColor: '#20429a',
                        confirmButtonText: "Aceptar"
                    });
                    cargarGestionarInventarioPage();
                })
                .catch(error => {
                    console.error('Error al eliminar producto de Google Sheets:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar el producto de Google Sheets. Detalles: ' + error.message,
                        confirmButtonColor: '#20429a'
                    });
                });
        }
    });
}

// Event listener for file input change to show preview
if (gestionarFotoProductoInputPage) {
    gestionarFotoProductoInputPage.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                fotoPreviewPage.src = e.target.result;
                fotoPreviewPage.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            fotoPreviewPage.src = '#';
            fotoPreviewPage.style.display = 'none';
        }
    });
}


if (guardarProductoButtonPage) {
    guardarProductoButtonPage.addEventListener('click', () => {
    });
}

if (cancelarEdicionProductoButtonPage) {
    cancelarEdicionProductoButtonPage.addEventListener('click', () => {
        limpiarFormularioProductoPage();
    });
}

if (guardarProductoButtonPage) {
    guardarProductoButtonPage.addEventListener('click', () => {
        const id = editProductoIdInputPage.value ? parseInt(editProductoIdInputPage.value) : null;
        const nombre = gestionarNombreProductoInputPage.value.trim();
        const precio = parseFloat(gestionarPrecioProductoInputPage.value);
        const stock = parseInt(gestionarStockProductoInputPage.value);
        const fotoFile = gestionarFotoProductoInputPage.files[0];
        const categoria = document.getElementById('gestionar-categoria-producto').value.trim();

        if (nombre === '' || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0 || categoria === '') {
            Swal.fire({ icon: 'error', title: 'Datos Incompletos', text: 'Por favor, complete todos los campos correctamente (Nombre, Precio, Stock, Categoría).', confirmButtonColor: '#20429a' });
            return;
        }

        const guardarProductoConFoto = (fotoBase64 = null) => {
            const producto = {
                id: id || Date.now().toString(), // Si es nuevo, generar ID único
                nombre: nombre,
                precioUSD: precio,
                inventario: stock,
                categoria: categoria,
                fotoBase64: fotoBase64
            };

            if (id) { // Editing existing product
                // Actualizar producto existente en Google Sheets
                actualizarProductoEnSheet(id, producto)
                    .then(data => {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Éxito!',
                            text: 'Producto actualizado exitosamente.',
                            confirmButtonColor: '#20429a'
                        });
                        cargarGestionarInventarioPage();
                        limpiarFormularioProductoPage();
                    })
                    .catch(error => {
                        console.error('Error al actualizar producto en Google Sheets:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo actualizar el producto en Google Sheets. Detalles: ' + error.message,
                            confirmButtonColor: '#20429a'
                        });
                    });
            } else { // Adding new product
                // Insertar nuevo producto en Google Sheets
                insertarProductoEnSheet(producto)
                    .then(data => {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Éxito!',
                            text: 'Producto agregado exitosamente.',
                            confirmButtonColor: '#20429a'
                        });
                        cargarGestionarInventarioPage();
                        limpiarFormularioProductoPage();
                    })
                    .catch(error => {
                        console.error('Error al insertar producto en Google Sheets:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo guardar el producto en Google Sheets. Detalles: ' + error.message,
                            confirmButtonColor: '#20429a'
                        });
                    });
            }
        };

        const resizeImage = (base64, maxWidth = 100, maxHeight = 100) => {
            return new Promise((resolve) => {
                let img = new Image();
                img.src = base64;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }

                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }

                    let canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    let ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png'));
                }
            });
        };

        if (fotoFile) {
            const reader = new FileReader();
            reader.onloadend = async function () {
                const resizedImage = await resizeImage(reader.result);
                guardarProductoConFoto(resizedImage);
            }
            reader.readAsDataURL(fotoFile);
        } else {
            // Si no se seleccionó un archivo nuevo, y estamos editando, mantenemos la foto existente.
            // Si es un producto nuevo sin foto, fotoBase64 será null.
            const fotoExistente = id ? (gestionarProductosDisponibles.find(p => p.id === id)?.fotoBase64 || null) : null;
            guardarProductoConFoto(fotoExistente);
        }
    });
}

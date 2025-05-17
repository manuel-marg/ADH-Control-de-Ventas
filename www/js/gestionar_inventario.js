document.addEventListener('deviceready', onDeviceReadyGestionarInventario, false);

function onDeviceReadyGestionarInventario() {
    console.log('Running cordova for gestionar_inventario.html');
    if (!localStorage.getItem('currentUser')) {
        // window.location.href = "index.html";
    }
    // Se moverá la llamada a cargarGestionarInventarioPage para asegurar que los datos estén listos.
}

// Inicializar productos desde localStorage o como array vacío
let gestionarProductosDisponibles = JSON.parse(localStorage.getItem('productos')) || [];

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
// const volverMenuGestionarButtonPage = document.getElementById('volver-menu-gestionar-button'); // Botón eliminado

function cargarGestionarInventarioPage() {
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

// Event listener for file input change to show preview
if (gestionarFotoProductoInputPage) {
    gestionarFotoProductoInputPage.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
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
        const id = editProductoIdInputPage.value ? parseInt(editProductoIdInputPage.value) : null;
        const nombre = gestionarNombreProductoInputPage.value.trim();
        const precio = parseFloat(gestionarPrecioProductoInputPage.value);
        const stock = parseInt(gestionarStockProductoInputPage.value);
        const fotoFile = gestionarFotoProductoInputPage.files[0];

        if (nombre === '' || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0) {
            Swal.fire({ icon: 'error', title: 'Datos Incompletos', text: 'Por favor, complete todos los campos correctamente (Nombre, Precio, Stock).', confirmButtonColor: '#20429a' });
            return;
        }

        const guardarProductoConFoto = (fotoBase64 = null) => {
            let mensajeExito = '';
            if (id) { // Editing existing product
                const productoIndex = gestionarProductosDisponibles.findIndex(p => p.id === id);
                if (productoIndex > -1) {
                    if (gestionarProductosDisponibles.find(p => p.nombre.toLowerCase() === nombre.toLowerCase() && p.id !== id)) {
                        Swal.fire({ icon: 'error', title: 'Error', text: 'Un producto con este nombre ya existe.', confirmButtonColor: '#20429a' });
                        return;
                    }
                    const productoExistente = gestionarProductosDisponibles[productoIndex];
                    gestionarProductosDisponibles[productoIndex] = { 
                        ...productoExistente, 
                        nombre, 
                        precioUSD: precio, 
                        inventario: stock,
                        fotoBase64: fotoBase64 || productoExistente.fotoBase64 
                    };
                    mensajeExito = 'Producto actualizado exitosamente.';
                }
            } else { // Adding new product
                const nuevoId = gestionarProductosDisponibles.length > 0 ? Math.max(...gestionarProductosDisponibles.map(p => p.id)) + 1 : 1;
                if (gestionarProductosDisponibles.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Un producto con este nombre ya existe.', confirmButtonColor: '#20429a' });
                    return;
                }
                gestionarProductosDisponibles.push({ id: nuevoId, nombre, precioUSD: precio, inventario: stock, fotoBase64 });
                mensajeExito = 'Producto agregado exitosamente.';
            }
            localStorage.setItem('productos', JSON.stringify(gestionarProductosDisponibles));
            Swal.fire({ icon: 'success', title: '¡Éxito!', text: mensajeExito, confirmButtonColor: '#20429a' });
            cargarGestionarInventarioPage();
            limpiarFormularioProductoPage();
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
            reader.onloadend = async function() {
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

if (cancelarEdicionProductoButtonPage) {
    cancelarEdicionProductoButtonPage.addEventListener('click', limpiarFormularioProductoPage);
}

function eliminarProductoPage(productoId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir la eliminación de este producto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#20429a', // Changed to blue
        cancelButtonColor: '#d33', // Kept red for cancel
        confirmButtonText: 'Aceptar', // Changed to "Aceptar"
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            gestionarProductosDisponibles = gestionarProductosDisponibles.filter(p => p.id !== productoId);
            localStorage.setItem('productos', JSON.stringify(gestionarProductosDisponibles));
            cargarGestionarInventarioPage();
            Swal.fire(
                '¡Eliminado!',
                'El producto ha sido eliminado.',
                'success'
            );
        }
    });
}

// if (volverMenuGestionarButtonPage) { // Botón eliminado
//     volverMenuGestionarButtonPage.addEventListener('click', () => {
//         window.location.href = "menu.html";
//     });
// }

/* Configuración
 * Reemplaza 'YOUR_SPREADSHEET_ID' con el ID de tu hoja de cálculo
 */
const SPREADSHEET_ID = '10hKUdLlhUMESPrjjjDvXTmfN6A5HvR7h8hwOW4S5ksA'; // Using the same spreadsheet as ventas
const SHEET_NAME = 'Inventario';

/* Procesa todas las solicitudes GET
 */
function doGet(req) {
  // Manejar solicitudes CORS (preflight) - Google Apps Script no expone contextPath directamente
  // Para solicitudes OPTIONS, Google Apps Script las maneja aparte

  var action = req.parameter.action;
  var db = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetInventario = db.getSheetByName(SHEET_NAME);

  switch(action) {
    case "insert":
      return insertarProducto(req, sheetInventario);
    case "readAll":
      return readAllProducts(req, sheetInventario);
    case "update":
      return updateProduct(req, sheetInventario);
    case "delete":
      return deleteProduct(req, sheetInventario);
    case "readById":
      return readProductById(req, sheetInventario);
    default:
      return response().json({
        status: false,
        message: 'Acción no válida'
      });
  }
}

/* Insertar nuevo producto
 * Parámetros esperados:
 * - nombre: nombre del producto
 * - precioUSD: precio del producto en dólares
 * - inventario: cantidad disponible en stock
 * - categoria: categoría del producto
 * - fotoBase64: imagen del producto en formato base64 (opcional)
 * - idProducto: ID único del producto (opcional, se generará si no se proporciona)
 */
function insertarProducto(req, sheet) {
  try {
    var nombre = req.parameter.nombre;
    var precioUSD = parseFloat(req.parameter.precioUSD);
    var inventario = parseInt(req.parameter.inventario);
    var categoria = req.parameter.categoria;
    var fotoBase64 = req.parameter.fotoBase64 || '';
    var idProducto = req.parameter.idProducto || generateProductId(); // Generate if not provided

    // Validate required fields
    if (!nombre || isNaN(precioUSD) || isNaN(inventario) || !categoria) {
      return response().json({
        status: false,
        message: 'Datos incompletos: nombre, precioUSD, inventario y categoría son obligatorios'
      });
    }

    // Verificar si la hoja tiene encabezados, si no, crearlos
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Nombre Producto',
        'Precio USD',
        'Stock',
        'Categoría',
        'Foto Base64',
        'ID Producto'
      ]);
    }

    // Agregar nueva fila con los datos del producto
    sheet.appendRow([
      nombre,
      precioUSD,
      inventario,
      categoria,
      fotoBase64,
      idProducto
    ]);

    return response().json({
      status: true,
      message: 'Producto registrado exitosamente',
      productId: idProducto
    });
  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al registrar el producto: ' + error.toString()
    });
  }
}

/* Lee todos los productos
 *
 * @request-parameter | action<string> = "readAll"
 * @example-request | ?action=readAll
 */
function readAllProducts(req, sheet) {
  try {
    var data = _readData(sheet);
    return response().json({
      status: true,
      records: data.records
    });

  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al leer productos: ' + error.toString()
    });
  }
}

/* Lee un producto por ID
 * Parámetros esperados:
 * - idProducto: ID del producto a buscar
 */
function readProductById(req, sheet) {
  try {
    var idProducto = req.parameter.idProducto;
    
    if (!idProducto) {
      return response().json({
        status: false,
        message: 'ID de producto es requerido'
      });
    }

    var data = _readData(sheet);
    var product = data.records.find(function(item) {
      return item.ID_Producto == idProducto; // Using underscore instead of space
    });

    if (product) {
      return response().json({
        status: true,
        record: product
      });
    } else {
      return response().json({
        status: false,
        message: 'Producto no encontrado'
      });
    }

  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al leer producto: ' + error.toString()
    });
  }
}

/* Actualizar producto existente
 * Parámetros esperados:
 * - idProducto: ID del producto a actualizar
 * - nombre: nuevo nombre del producto (opcional)
 * - precioUSD: nuevo precio del producto en dólares (opcional)
 * - inventario: nueva cantidad disponible en stock (opcional)
 * - categoria: nueva categoría del producto (opcional)
 * - fotoBase64: nueva imagen del producto en formato base64 (opcional)
 */
function updateProduct(req, sheet) {
  try {
    var idProductoToUpdate = req.parameter.idProducto;
    
    if (!idProductoToUpdate) {
      return response().json({
        status: false,
        message: 'ID de producto es requerido para actualización'
      });
    }

    var data = _readData(sheet);
    var records = data.records;
    var headers = _getHeaderRow(sheet);

    var idColumnIndex = headers.indexOf('ID Producto');
    var nombreColumnIndex = headers.indexOf('Nombre Producto');
    var precioColumnIndex = headers.indexOf('Precio USD');
    var stockColumnIndex = headers.indexOf('Stock');
    var categoriaColumnIndex = headers.indexOf('Categoría');
    var fotoColumnIndex = headers.indexOf('Foto Base64');

    if (idColumnIndex === -1 || nombreColumnIndex === -1 || precioColumnIndex === -1 || 
        stockColumnIndex === -1 || categoriaColumnIndex === -1 || fotoColumnIndex === -1) {
      throw new Error('Una o más columnas necesarias no se encontraron.');
    }

    var rowFound = false;
    for (var i = 0; i < records.length; i++) {
      var record = records[i];
      var sheetId = record.ID_Producto; // This will be the ID value from the sheet

      if (sheetId == idProductoToUpdate) {
        var rowIdx = i + 2; // +2 because sheet rows are 1-indexed and header is row 1
        
        // Update fields if provided in request
        var newName = req.parameter.nombre;
        var newPrice = req.parameter.precioUSD;
        var newStock = req.parameter.inventario;
        var newCategory = req.parameter.categoria;
        var newPhoto = req.parameter.fotoBase64;
        
        if (newName !== undefined) {
          sheet.getRange(rowIdx, nombreColumnIndex + 1).setValue(newName);
        }
        if (newPrice !== undefined) {
          sheet.getRange(rowIdx, precioColumnIndex + 1).setValue(parseFloat(newPrice));
        }
        if (newStock !== undefined) {
          sheet.getRange(rowIdx, stockColumnIndex + 1).setValue(parseInt(newStock));
        }
        if (newCategory !== undefined) {
          sheet.getRange(rowIdx, categoriaColumnIndex + 1).setValue(newCategory);
        }
        if (newPhoto !== undefined) {
          sheet.getRange(rowIdx, fotoColumnIndex + 1).setValue(newPhoto);
        }
        
        rowFound = true;
        break;
      }
    }

    if (rowFound) {
      return response().json({
        status: true,
        message: 'Producto actualizado exitosamente'
      });
    } else {
      return response().json({
        status: false,
        message: 'Producto no encontrado con ID: ' + idProductoToUpdate
      });
    }
  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al actualizar el producto: ' + error.toString()
    });
  }
}

/* Eliminar producto existente
 * Parámetros esperados:
 * - idProducto: ID del producto a eliminar
 */
function deleteProduct(req, sheet) {
  try {
    var idProducto = req.parameter.idProducto;

    if (!idProducto) {
      return response().json({
        status: false,
        message: 'ID de producto es requerido para eliminación'
      });
    }

    var data = _readData(sheet);
    var records = data.records;
    var headers = _getHeaderRow(sheet);

    var idColumnIndex = headers.indexOf('ID Producto');

    if (idColumnIndex === -1) {
      throw new Error('La columna de ID no se encontró.');
    }

    var rowFound = false;
    for (var i = 0; i < records.length; i++) {
      var record = records[i];
      var sheetId = record.ID_Producto;

      if (sheetId == idProducto) {
        var rowIdx = i + 2; // +2 because sheet rows are 1-indexed and header is row 1
        sheet.deleteRow(rowIdx);
        rowFound = true;
        break;
      }
    }

    if (rowFound) {
      return response().json({
        status: true,
        message: 'Producto eliminado exitosamente'
      });
    } else {
      return response().json({
        status: false,
        message: 'Producto no encontrado con ID: ' + idProducto
      });
    }
  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al eliminar el producto: ' + error.toString()
    });
  }
}

/* Servicio auxiliar para leer datos de la hoja
 */
function _readData(sheetObject) {
   var sh = sheetObject;
   var properties = _getHeaderRow(sh);
   properties = properties.map(function (p) {
      return p.replace(/\s+/g, '_'); // Replace spaces in headers for object keys
   });

   var rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
   var data = [];

   for (var r = 0, l = rows.length; r < l; r++) {
      var row = rows[r],
          record = {};

      for (var p in properties) {
         record[properties[p]] = row[p];
      }

      data.push(record);
   }

   return { records: data };
}

/* Servicio auxiliar para obtener la fila de encabezado
 */
function _getHeaderRow(sheetObject) {
   var sh = sheetObject;
   return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

/* Función auxiliar para generar ID de producto si no se proporciona
 */
function generateProductId() {
  return Date.now().toString(); // Using timestamp as a simple ID generator
}

/* Función auxiliar para formatear la respuesta JSON
 */
function response() {
  return {
    json: function(data) {
      var output = ContentService.createTextOutput(JSON.stringify(data));
      output.setMimeType(ContentService.MimeType.JSON);
      // Google Apps Script maneja automáticamente los encabezados CORS cuando se despliega como Web App
      return output;
    }
  };
}

// doGet ya maneja solicitudes GET
// Para solicitudes OPTIONS (preflight), Google Apps Script normalmente las maneja automáticamente
// cuando está configurado correctamente en el despliegue
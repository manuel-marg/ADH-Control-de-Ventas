/* Configuración
 * Reemplaza 'YOUR_SPREADSHEET_ID' con el ID de tu hoja de cálculo
 */
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'Ventas';

/* Procesa todas las solicitudes GET
 */
function doGet(req) {
  var action = req.parameter.action;
  var db = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetVentas = db.getSheetByName(SHEET_NAME);
  
  switch(action) {
    case "insert":
      return insertarVenta(req, sheetVentas);
    case "readPending":
      return readPendingSales(req, sheetVentas);
    case "updateSale":
      return updateSale(req, sheetVentas);
    default:
      return response().json({
        status: false,
        message: 'Acción no válida'
      });
  }
}

/* Lee las ventas pendientes
 *
 * @request-parameter | action<string> = "readPending"
 * @example-request | ?action=readPending
 */
function readPendingSales(req, sheet) {
  try {
    var data = _readData(sheet);
    var pendingSales = data.records.filter(function(sale) {
      // Assuming 'Estado_de_Venta' is the header for the status column after replacing spaces
      return sale.Estado_de_Venta === 'pendiente';
    });

    return response().json({
      status: true,
      records: pendingSales
    });

  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al leer ventas pendientes: ' + error.toString()
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

/* Insertar nueva venta
 * Parámetros esperados:
 * - fecha: fecha de la venta
 * - usuario: nombre del usuario que registra la venta
 * - metodoPago1: primer método de pago utilizado
 * - montoPago1: monto del primer pago
 * - metodoPago2: segundo método de pago (opcional)
 * - montoPago2: monto del segundo pago (opcional)
 * - productos: string con los productos vendidos
 * - totalUSD: monto total en dólares
 * - totalBS: monto total en bolívares
 */
function insertarVenta(req, sheet) {
  try {
    var fecha = req.parameter.fecha;
    var usuario = req.parameter.usuario;
    var metodoPago1 = req.parameter.metodoPago1;
    var montoPago1 = req.parameter.montoPago1;
    var metodoPago2 = req.parameter.metodoPago2 || '';
    var montoPago2 = req.parameter.montoPago2 || '0';
    var productos = req.parameter.productos;
    var totalUSD = req.parameter.totalUSD;
    var totalBS = req.parameter.totalBS;
    var estadoVenta = req.parameter.estado_venta || 'desconocido'; // Nuevo parámetro
    var nombreCliente = req.parameter.nombreCliente || ''; // Nuevo parámetro para ventas pendientes

    // Verificar si la hoja tiene encabezados, si no, crearlos
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Fecha',
        'Usuario',
        'Método de Pago 1',
        'Monto Pago 1',
        'Método de Pago 2',
        'Monto Pago 2',
        'Productos',
        'Total USD',
        'Total BS',
        'Estado de Venta', // Nuevo encabezado
        'Nombre Cliente' // Nuevo encabezado
      ]);
    }

    // Agregar nueva fila con los datos de la venta
    sheet.appendRow([
      fecha,
      usuario,
      metodoPago1,
      montoPago1,
      metodoPago2,
      montoPago2,
      productos,
      totalUSD,
      totalBS,
      estadoVenta, // Incluir estado de venta
      nombreCliente // Incluir nombre del cliente
    ]);

    return response().json({
      status: true,
      message: 'Venta registrada exitosamente'
    });

  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al registrar la venta: ' + error.toString()
    });
  }
}

/* Actualizar venta existente
 * Parámetros esperados:
 * - fecha: fecha de la venta a actualizar (usado como ID)
 * - estado_venta: nuevo estado de la venta (e.g., 'completada')
 * - metodoPago1: primer método de pago utilizado
 * - montoPago1: monto del primer pago
 * - metodoPago2: segundo método de pago (opcional)
 * - montoPago2: monto del segundo pago (opcional)
 */
function updateSale(req, sheet) {
  try {
    var fechaToUpdate = req.parameter.fecha;
    var newEstadoVenta = req.parameter.estado_venta;
    var newMetodoPago1 = req.parameter.metodoPago1;
    var newMontoPago1 = req.parameter.montoPago1;
    var newMetodoPago2 = req.parameter.metodoPago2 || '';
    var newMontoPago2 = req.parameter.montoPago2 || '0';

     var data = _readData(sheet);
     var records = data.records;
     var headers = _getHeaderRow(sheet);

     var fechaColumnIndex = headers.indexOf('Fecha');
     var estadoVentaColumnIndex = headers.indexOf('Estado de Venta');
     var metodoPago1ColumnIndex = headers.indexOf('Método de Pago 1');
     var montoPago1ColumnIndex = headers.indexOf('Monto Pago 1');
     var metodoPago2ColumnIndex = headers.indexOf('Método de Pago 2');
     var montoPago2ColumnIndex = headers.indexOf('Monto Pago 2');

     if (fechaColumnIndex === -1 || estadoVentaColumnIndex === -1 || metodoPago1ColumnIndex === -1 || montoPago1ColumnIndex === -1 || metodoPago2ColumnIndex === -1 || montoPago2ColumnIndex === -1) {
       throw new Error('Una o más columnas necesarias no se encontraron.');
     }

     // Helper function to format a Date object to 'DD/MM/YYYY HH:MM:SS'
     // This function is now defined outside updateSale for efficiency, but included here for context.
     // function formatDateTime(date) { ... }

     // Parse the incoming date string to a Date object, then format it for comparison
     // This assumes fechaToUpdate is in 'DD/MM/YYYY HH:MM:SS' format from the client
     var parsedFechaToUpdate = fechaToUpdate; // The client should send the date in the correct string format

     var rowFound = false;
     for (var i = 0; i < records.length; i++) {
       var record = records[i];
       var sheetDate = record.Fecha; // This will be a Date object if the cell is formatted as date/time

       // Format the sheet date to 'DD/MM/YYYY HH:MM:SS' for comparison
       var sheetDateString = '';
       if (sheetDate instanceof Date) {
         sheetDateString = Utilities.formatDate(sheetDate, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
       } else {
         sheetDateString = String(sheetDate); // Fallback for non-Date values
       }

       if (sheetDateString === parsedFechaToUpdate) {
         var rowIdx = i + 2; // +2 because sheet rows are 1-indexed and header is row 1
         sheet.getRange(rowIdx, estadoVentaColumnIndex + 1).setValue(newEstadoVenta);
         sheet.getRange(rowIdx, metodoPago1ColumnIndex + 1).setValue(newMetodoPago1);
         sheet.getRange(rowIdx, montoPago1ColumnIndex + 1).setValue(newMontoPago1);
         sheet.getRange(rowIdx, metodoPago2ColumnIndex + 1).setValue(newMetodoPago2);
         sheet.getRange(rowIdx, montoPago2ColumnIndex + 1).setValue(newMontoPago2);
         rowFound = true;
         break;
       }
     }

    if (rowFound) {
      return response().json({
        status: true,
        message: 'Venta actualizada exitosamente'
      });
    } else {
      return response().json({
        status: false,
        message: 'Venta no encontrada para la fecha: ' + fechaToUpdate
      });
    }

  } catch (error) {
    return response().json({
      status: false,
      message: 'Error al actualizar la venta: ' + error.toString()
    });
  }
}

/* Función auxiliar para formatear la respuesta JSON
 */
function response() {
  return {
    json: function(data) {
      return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}
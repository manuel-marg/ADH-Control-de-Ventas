/* Configuración
 * Reemplaza 'YOUR_SPREADSHEET_ID' con el ID de tu hoja de cálculo
 */
const SPREADSHEET_ID = '10hKUdLlhUMESPrjjjDvXTmfN6A5HvR7h8hwOW4S5ksA'; // Replace with your actual Spreadsheet ID
const SHEET_NAME = 'Ventas'; // The sheet name where sales are recorded

/* Procesa todas las solicitudes GET
 */
function doGet(req) {
  var action = req.parameter.action;
  var db = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetVentas = db.getSheetByName(SHEET_NAME);

  switch(action) {
    case "read":
      return readPendingSales(req, sheetVentas);
    default:
      return response().json({
        status: false,
        message: 'Acción no válida'
      });
  }
}

/* Lee las ventas pendientes
 *
 * @request-parameter | action<string> = "read"
 * @example-request | ?action=read
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
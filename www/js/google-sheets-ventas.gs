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
    default:
      return response().json({
        status: false,
        message: 'Acción no válida'
      });
  }
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
        'Total BS'
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
      totalBS
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
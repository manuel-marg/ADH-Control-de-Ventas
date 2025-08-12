// This script will generate weekly sales reports in Google Sheets.
// It will group products by category and calculate daily revenue by category and payment method.

function generateWeeklySalesReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName("Ventas");
  const salesData = salesSheet.getDataRange().getValues();

  // Define payment methods with mappings to handle variations
  const paymentMethodMappings = {
    "DIVISAS": ["DIVISAS", "Divisas", "Efectivo ($)"],
    "P/VENTA": ["P/VENTA", "Punto de venta (Bs)", "Punto de venta", "Punto de ventas(Bs)"],
    "EFECTIVO/BS.": ["EFECTIVO/BS.", "Efectivo (Bs)", "Efectivo", "Efectivo en BS", "Efectivo en Bs."],
    "PAGO MÓVIL": ["PAGO MÓVIL", "Pago Móvil", "Pago móvil", "Pago Movil"],
    "ZELLE": ["ZELLE", "Zelle"],
    "TRANS. BANC.": ["TRANS. BANC.", "Transferencia en Bs.", "Tranferencia en Bs"],
    "TRANS. USD": ["TRANS. USD", "Transferencia en $"]
  };
  
  // Clasificar métodos de pago por moneda
  const usdPaymentMethods = ["Efectivo ($)", "Zelle", "DIVISAS", "Divisas", "Transferencia en $", "TRANS. USD"];
  const bsPaymentMethods = ["Punto de ventas(Bs)", "Punto de venta (Bs)", "Punto de venta", "P/VENTA", 
                           "Pago Movil", "Pago Móvil", "PAGO MÓVIL", "Pago móvil", 
                           "Transferencia en Bs.", "Tranferencia en Bs", "TRANS. BANC.", 
                           "Efectivo en BS", "EFECTIVO/BS.", "Efectivo en Bs.", "Efectivo"];
  const paymentMethods = Object.keys(paymentMethodMappings);

  // Get current date and calculate the start and end of the current week (Monday to Sunday)
  // For testing purposes, we'll include the current week instead of last week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday
  
  // Use current week instead of last week for testing
  const lastMonday = new Date(new Date().setDate(diff));
  const lastSunday = new Date(new Date().setDate(diff + 6));
  
  // For production, uncomment these lines to use last week instead
  // const lastMonday = new Date(today.setDate(diff - 7));
  // const lastSunday = new Date(today.setDate(diff - 1));

  // Format dates for sheet name
  const lastMondayFormatted = Utilities.formatDate(lastMonday, ss.getSpreadsheetTimeZone(), "dd/MM");
  const lastSundayFormatted = Utilities.formatDate(lastSunday, ss.getSpreadsheetTimeZone(), "dd/MM");
  
  // Obtener el mes de las ventas en lugar de la fecha actual
  const salesMonth = new Date(salesData[1][0]); // Usar la primera venta después del encabezado
  const monthName = Utilities.formatDate(salesMonth, ss.getSpreadsheetTimeZone(), "MMMM").toUpperCase();

  const reportSheetName = `SEMANA DEL ${lastMondayFormatted.split('/')[0]} AL ${lastSundayFormatted.split('/')[0]} DE ${monthName}`;

  // Create a new sheet for the report
  let reportSheet = ss.getSheetByName(reportSheetName);
  if (reportSheet) {
    ss.deleteSheet(reportSheet);
  }
  reportSheet = ss.insertSheet(reportSheetName);

  // Set up report headers
  reportSheet.getRange(1, 1).setValue("REPORTE DE VENTAS SEMANAL");
  const weekRange = `DESDE LUNES ${lastMondayFormatted} HASTA VIERNES ${lastSundayFormatted}`;
reportSheet.getRange(2, 1).setValue(`MES: ${monthName}`);
reportSheet.getRange(3, 1).setValue(weekRange);
  reportSheet.getRange(4, 1).setValue("CATEGORÍA");

  // Prepare data structure for reporting
  const salesByCategoryAndDay = {};
  const salesByCategoryAndPaymentMethod = {};

  // Process sales data, skipping header row
  Logger.log("Iniciando procesamiento de datos de ventas");

  // Log de la estructura de la primera fila para entender las columnas
  if (salesData.length > 0) {
    Logger.log(`Estructura de la primera fila: ${JSON.stringify(salesData[0])}`);
  }

  // Prepare data structures for different sale states
  const completedSales = [];
  const cortesiaSales = [];
  const pendienteSales = [];

  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const timestamp = new Date(row[0]); // Assuming timestamp is in column A
    const saleState = row[9]; // Estado de Venta is in column J (index 9)

    // Check if the sale falls within the last week
    if (timestamp >= lastMonday && timestamp <= lastSunday) {
      // Filter sales by state
      if (saleState === "completada") {
        completedSales.push(row);
      } else if (saleState === "cortesia") {
        cortesiaSales.push(row);
      } else if (saleState === "pendiente") {
        pendienteSales.push(row);
      }
    }
  }

  // Process completed sales
  for (let i = 0; i < completedSales.length; i++) {
    const row = completedSales[i];
    Logger.log(`Procesando venta del ${Utilities.formatDate(new Date(row[0]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy")}`);

    const productString = row[6]; // Productos están en la columna 7 (índice 6)
    Logger.log(`Producto: ${productString}`);

    // Mejorar la extracción de categoría para asegurar que funcione correctamente
    let category = "Sin Categoría";
    if (productString) {
      const categoryMatch = productString.match(/\(([^)]+)\)/);
      if (categoryMatch && categoryMatch[1]) {
        category = categoryMatch[1].trim(); // Eliminar espacios en blanco
        Logger.log(`Categoría extraída: ${category}`);
      } else {
        Logger.log(`No se pudo extraer categoría de: ${productString}`);
      }
    } else {
      Logger.log("String de producto vacío o nulo");
    }

    // Obtener los métodos de pago y montos
    const paymentMethod1 = row[2]; // Método de Pago 1
    const paymentAmount1 = parseFloat(row[3] || 0); // Monto Pago 1
    const paymentMethod2 = row[4]; // Método de Pago 2
    const paymentMethod2Present = paymentMethod2 && paymentMethod2.trim() !== "";
    const paymentAmount2 = parseFloat(row[5] || 0); // Monto Pago 2

    // Determinar si los pagos son en USD o BS
    const isPayment1USD = usdPaymentMethods.includes(paymentMethod1);
    const isPayment2USD = paymentMethod2Present && usdPaymentMethods.includes(paymentMethod2);
    const isPayment1BS = bsPaymentMethods.includes(paymentMethod1);
    const isPayment2BS = paymentMethod2Present && bsPaymentMethods.includes(paymentMethod2);

    // Calcular el total de ventas (USD y BS)
    let totalSale = 0;
    if (isPayment1USD || isPayment1BS) {
      totalSale += paymentAmount1;
    }
    if (isPayment2USD || isPayment2BS) {
      totalSale += paymentAmount2;
    }

    Logger.log(`Método de pago 1: ${paymentMethod1}, Monto: ${paymentAmount1}, Es USD: ${isPayment1USD}`);
    if (paymentMethod2Present) {
      Logger.log(`Método de pago 2: ${paymentMethod2}, Monto: ${paymentAmount2}, Es USD: ${isPayment2USD}`);
    }
    Logger.log(`Monto total en USD: ${totalSale}`);

    // Get payment method from column C (index 2) for first payment method
    const rawPaymentMethod = row[2]; // Payment method 1 is in column C
    Logger.log(`Método de pago original: ${rawPaymentMethod}`);

    // Map the raw payment method to standardized format
    let paymentMethod = "Otro";
    for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
      if (variations.includes(rawPaymentMethod)) {
        paymentMethod = standardMethod;
        break;
      }
    }
    Logger.log(`Método de pago estandarizado: ${paymentMethod}`);

    const saleDate = Utilities.formatDate(new Date(row[0]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy");

    if (!salesByCategoryAndDay[category]) {
      salesByCategoryAndDay[category] = {};
    }
    if (!salesByCategoryAndDay[category][saleDate]) {
      salesByCategoryAndDay[category][saleDate] = 0;
    }
    salesByCategoryAndDay[category][saleDate] += totalSale;

    if (!salesByCategoryAndPaymentMethod[category]) {
      salesByCategoryAndPaymentMethod[category] = {};
    }
    if (!salesByCategoryAndPaymentMethod[category][paymentMethod]) {
      salesByCategoryAndPaymentMethod[category][paymentMethod] = 0;
    }
    salesByCategoryAndPaymentMethod[category][paymentMethod] += totalSale;

    Logger.log(`Venta procesada: Categoría=${category}, Fecha=${saleDate}, Método=${paymentMethod}, Monto=${totalSale}`);
  }
  
  // Log de categorías procesadas
  Logger.log(`Categorías procesadas: ${Object.keys(salesByCategoryAndDay).join(', ')}`);


  // Get unique dates from the last week
  const uniqueDates = [];
  for (let d = new Date(lastMonday); d <= lastSunday; d.setDate(d.getDate() + 1)) {
    uniqueDates.push(Utilities.formatDate(d, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy"));
  }

  // Prepare data structure for day-of-week reporting
  const daysOfWeek = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
  const salesByCategoryDayAndMethod = {};
  
  // Get unique categories from sales data
  const uniqueCategories = [];
  
  // Log para depuración
  Logger.log("Iniciando extracción de categorías");
  
  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const timestamp = new Date(row[0]);
    
    if (timestamp >= lastMonday && timestamp <= lastSunday) {
      const productString = row[6]; // Productos están en la columna 7 (índice 6)
      // Log del string de producto para depuración
      Logger.log(`Producto encontrado: ${productString}`);
      
      // Mejorar la extracción de categoría
      let category = "Sin Categoría";
      if (productString) {
        const categoryMatch = productString.match(/\(([^)]+)\)/);
        if (categoryMatch && categoryMatch[1]) {
          category = categoryMatch[1].trim(); // Eliminar espacios en blanco
          Logger.log(`Categoría extraída: ${category}`);
        } else {
          Logger.log(`No se pudo extraer categoría de: ${productString}`);
        }
      }
      
      // Verificar que la categoría no sea vacía o nula
      if (category && category !== "") {
        if (!uniqueCategories.includes(category)) {
          uniqueCategories.push(category);
          Logger.log(`Nueva categoría añadida: ${category}`);
        }
        
        if (!salesByCategoryDayAndMethod[category]) {
          salesByCategoryDayAndMethod[category] = {};
          daysOfWeek.forEach(day => {
            salesByCategoryDayAndMethod[category][day] = {};
            paymentMethods.forEach(method => {
              salesByCategoryDayAndMethod[category][day][method] = 0;
            });
          });
        }
      } else {
        Logger.log(`Categoría inválida ignorada: ${category}`);
      }
    }
  }
  
  // Log de todas las categorías encontradas
  Logger.log(`Categorías únicas encontradas: ${uniqueCategories.join(', ')}`);
  
  // Si no hay categorías, añadir una por defecto para evitar errores
  if (uniqueCategories.length === 0) {
    uniqueCategories.push("Sin Categoría");
    Logger.log("No se encontraron categorías, se añadió 'Sin Categoría' por defecto");
  }
  
  // Process sales data for the day-of-week report
  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const timestamp = new Date(row[0]);
    
    if (timestamp >= lastMonday && timestamp <= lastSunday) {
      const productString = row[6]; // Productos están en la columna 7 (índice 6)
      
      // Usar la misma lógica mejorada para extraer la categoría
      let category = "Sin Categoría";
      if (productString) {
        const categoryMatch = productString.match(/\(([^)]+)\)/);
        if (categoryMatch && categoryMatch[1]) {
          category = categoryMatch[1].trim(); // Eliminar espacios en blanco
        }
      }
      
      // Verificar que la categoría sea válida
      if (category && category !== "" && uniqueCategories.includes(category)) {
        // Obtener los métodos de pago y montos
        const paymentMethod1 = row[2]; // Método de Pago 1
        const paymentAmount1 = parseFloat(row[3] || 0); // Monto Pago 1
        const paymentMethod2 = row[4]; // Método de Pago 2
        const paymentMethod2Present = paymentMethod2 && paymentMethod2.trim() !== "";
        const paymentAmount2 = parseFloat(row[5] || 0); // Monto Pago 2
        
        // Determinar si los pagos son en USD o BS
        const isPayment1USD = usdPaymentMethods.includes(paymentMethod1);
        const isPayment2USD = paymentMethod2Present && usdPaymentMethods.includes(paymentMethod2);
        const isPayment1BS = bsPaymentMethods.includes(paymentMethod1);
        const isPayment2BS = paymentMethod2Present && bsPaymentMethods.includes(paymentMethod2);
        
        // Calcular el total de ventas (USD y BS)
        let totalSale = 0;
        if (isPayment1USD || isPayment1BS) {
          totalSale += paymentAmount1;
        }
        if (isPayment2USD || isPayment2BS) {
          totalSale += paymentAmount2;
        }
        const rawPaymentMethod = row[2];
        
        // Map the raw payment method to standardized format
        let paymentMethod = "Otro";
        for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
          if (variations.includes(rawPaymentMethod)) {
            paymentMethod = standardMethod;
            break;
          }
        }
        
        // Get day of week
        const dayOfWeekIndex = timestamp.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const dayName = daysOfWeek[dayOfWeekIndex === 0 ? 6 : dayOfWeekIndex - 1]; // Adjust to make Monday first
        
        // Process Payment Method 1
        if (paymentAmount1 > 0) {
          let paymentMethod1Standard = "Otro";
          for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
            if (variations.includes(paymentMethod1)) {
              paymentMethod1Standard = standardMethod;
              break;
            }
          }
          if (salesByCategoryDayAndMethod[category] && 
              salesByCategoryDayAndMethod[category][dayName] && 
              salesByCategoryDayAndMethod[category][dayName][paymentMethod1Standard] !== undefined) {
            salesByCategoryDayAndMethod[category][dayName][paymentMethod1Standard] += paymentAmount1;
            Logger.log(`Venta agregada (Pago 1): Categoría=${category}, Día=${dayName}, Método=${paymentMethod1Standard}, Monto=${paymentAmount1}`);
          } else {
            Logger.log(`Error: No se pudo agregar venta (Pago 1) para Categoría=${category}, Día=${dayName}, Método=${paymentMethod1Standard}`);
          }
        }

        // Process Payment Method 2 if present
        if (paymentMethod2Present && paymentAmount2 > 0) {
          let paymentMethod2Standard = "Otro";
          for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
            if (variations.includes(paymentMethod2)) {
              paymentMethod2Standard = standardMethod;
              break;
            }
          }
          if (salesByCategoryDayAndMethod[category] && 
              salesByCategoryDayAndMethod[category][dayName] && 
              salesByCategoryDayAndMethod[category][dayName][paymentMethod2Standard] !== undefined) {
            salesByCategoryDayAndMethod[category][dayName][paymentMethod2Standard] += paymentAmount2;
            Logger.log(`Venta agregada (Pago 2): Categoría=${category}, Día=${dayName}, Método=${paymentMethod2Standard}, Monto=${paymentAmount2}`);
          } else {
            Logger.log(`Error: No se pudo agregar venta (Pago 2) para Categoría=${category}, Día=${dayName}, Método=${paymentMethod2Standard}`);
          }
        }
      }
    }
  }
  
  // Log de verificación final
  Logger.log("Datos procesados para el reporte diario por categoría y método de pago");

  
  // Create the report table with the format shown in the image
  // First, set up the header row with categories
  let currentRow = 4;
  let currentColumn = 1;
  
  // Write "CATEGORÍA" in the first cell
  reportSheet.getRange(currentRow, currentColumn).setValue("CATEGORÍA");
  reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
  reportSheet.getRange(currentRow, currentColumn).setBackground("#95B3D7");
  
  // Write category headers
  currentColumn = 2;
  uniqueCategories.forEach(category => {
    // Log para depuración del encabezado de categoría
    Logger.log(`Creando encabezado para categoría: ${category}`);
    
    // Mostrar todas las categorías
      const headerRange = reportSheet.getRange(currentRow, currentColumn, 1, paymentMethods.length);
      headerRange.merge();
      headerRange.setValue(category.toUpperCase());
      headerRange.setHorizontalAlignment("center");
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#95B3D7");
      
      // Añadir borde para mejor visualización
      headerRange.setBorder(true, true, true, true, false, false, null, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      
      currentColumn += paymentMethods.length;
  });
  currentRow++;
  
  // Log para depuración después de crear los encabezados
  Logger.log(`Encabezados de categoría creados: ${uniqueCategories.join(', ')}`);
  Logger.log(`Métodos de pago disponibles: ${paymentMethods.join(', ')}`);

  
  // Write payment method headers under each category
  currentColumn = 2;
  uniqueCategories.forEach(category => {
    // Procesar todas las categorías
      paymentMethods.forEach(method => {
        reportSheet.getRange(currentRow, currentColumn).setValue(method);
        reportSheet.getRange(currentRow, currentColumn).setHorizontalAlignment("center");
        reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
        reportSheet.getRange(currentRow, currentColumn).setBackground("#FCD5B4"); // Light orange background
        currentColumn++;
      });
  });
  currentRow++;
  
  // Write day rows with values for each category and payment method
  daysOfWeek.forEach(day => {
    currentColumn = 1;
    reportSheet.getRange(currentRow, currentColumn).setValue(day);
    reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
    reportSheet.getRange(currentRow, currentColumn).setBackground("#f4f4f4");
    currentColumn++;
    
    uniqueCategories.forEach(category => {
      // Procesar todas las categorías
      {
        paymentMethods.forEach(method => {
          const value = salesByCategoryDayAndMethod[category] && 
                       salesByCategoryDayAndMethod[category][day] && 
                       salesByCategoryDayAndMethod[category][day][method] || 0;
          reportSheet.getRange(currentRow, currentColumn).setValue(value);
          currentColumn++;
        });
      }
    });
    currentRow++;
  });
  
  // Add TOTAL row
  currentColumn = 1;
  reportSheet.getRange(currentRow, currentColumn).setValue("TOTAL");
  reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
  reportSheet.getRange(currentRow, currentColumn).setBackground("#f4f4f4");
  currentColumn++;
  
  uniqueCategories.forEach(category => {
    // Procesar todas las categorías
    {
      paymentMethods.forEach(method => {
        let methodTotal = 0;
        daysOfWeek.forEach(day => {
          methodTotal += salesByCategoryDayAndMethod[category] && 
                        salesByCategoryDayAndMethod[category][day] && 
                        salesByCategoryDayAndMethod[category][day][method] || 0;
        });
        reportSheet.getRange(currentRow, currentColumn).setValue(methodTotal);
        reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
        currentColumn++;
      });
    }
  });
  currentRow++; // Move to the next row after the TOTAL row

  // Add a blank row
  currentRow++;

  // Calculate total income by payment type for the new table
  const totalIncomeByPaymentType = {};
  paymentMethods.forEach(method => {
    totalIncomeByPaymentType[method] = 0;
  });

  for (const category in salesByCategoryDayAndMethod) {
    for (const day in salesByCategoryDayAndMethod[category]) {
      for (const method in salesByCategoryDayAndMethod[category][day]) {
        totalIncomeByPaymentType[method] += salesByCategoryDayAndMethod[category][day][method];
      }
    }
  }

  // Add the new table for total income
  currentRow++;
  const totalIncomeTableStartRow = currentRow;
  reportSheet.getRange(currentRow, 1).setValue("INGRESO TOTAL");
  reportSheet.getRange(currentRow, 1).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1).setBackground("#95b3d7");
  reportSheet.getRange(currentRow, 1, 1, 3).merge(); // Merge for "INGRESO TOTAL" title

  currentRow++;
  reportSheet.getRange(currentRow, 1).setValue("Tipo de Pago");
  reportSheet.getRange(currentRow, 2).setValue("Monto");
  reportSheet.getRange(currentRow, 3).setValue("Moneda");
  reportSheet.getRange(currentRow, 1, 1, 3).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1, 1, 3).setBackground("#fcd5b4");

  // Define the order of payment methods for the new table
  const orderedPaymentMethods = [
    "DIVISAS",
    "P/VENTA",
    "EFECTIVO/BS.",
    "PAGO MÓVIL",
    "ZELLE",
    "TRANS. BANC.",
    "TRANS. USD"
  ];

  let totalUSD = 0;
  let totalBS = 0;

  orderedPaymentMethods.forEach(method => {
    currentRow++;
    reportSheet.getRange(currentRow, 1).setValue(method);
    const amount = totalIncomeByPaymentType[method] || 0;
    reportSheet.getRange(currentRow, 2).setValue(amount);

    let currency = "";
    if (["DIVISAS", "ZELLE", "TRANS. USD"].includes(method)) {
      currency = "$";
      totalUSD += amount;
    } else if (["P/VENTA", "EFECTIVO/BS.", "PAGO MÓVIL", "TRANS. BANC."].includes(method)) {
      currency = "Bs.";
      totalBS += amount;
    }
    reportSheet.getRange(currentRow, 3).setValue(currency);
  });

  // Add total rows for $ and Bs.
  currentRow++;
  reportSheet.getRange(currentRow, 1).setValue("TOTAL ($)");
  reportSheet.getRange(currentRow, 2).setValue(totalUSD);
  reportSheet.getRange(currentRow, 3).setValue("$");
  reportSheet.getRange(currentRow, 1, 1, 3).setFontWeight("bold");

  currentRow++;
  reportSheet.getRange(currentRow, 1).setValue("TOTAL (Bs.)");
  reportSheet.getRange(currentRow, 2).setValue(totalBS);
  reportSheet.getRange(currentRow, 3).setValue("Bs.");
  reportSheet.getRange(currentRow, 1, 1, 3).setFontWeight("bold");

  // Add new sections for cortesia and pendiente sales
  currentRow += 2; // Add space between sections

  // Section for cortesia sales
  reportSheet.getRange(currentRow, 1).setValue("VENTAS POR CORTESÍA");
  reportSheet.getRange(currentRow, 1).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1).setBackground("#ffcc00"); // Yellow background
  reportSheet.getRange(currentRow, 1, 1, 6).merge();
  currentRow++;

  // Add headers for cortesia sales
  const cortesiaHeaders = ["Fecha", "Usuario", "Método de Pago", "Monto", "Productos", "Total USD"];
  cortesiaHeaders.forEach((header, index) => {
    reportSheet.getRange(currentRow, index + 1).setValue(header);
    reportSheet.getRange(currentRow, index + 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, index + 1).setBackground("#fcd5b4");
  });
  currentRow++;

  // Add cortesia sales data with validation
  if (cortesiaSales.length > 0) {
    // Add headers for cortesia sales
    const cortesiaHeaders = ["Usuario", "Productos"];
    cortesiaHeaders.forEach((header, index) => {
      reportSheet.getRange(currentRow, index + 1).setValue(header);
      reportSheet.getRange(currentRow, index + 1).setFontWeight("bold");
      reportSheet.getRange(currentRow, index + 1).setBackground("#fcd5b4");
    });
    currentRow++;

    let cortesiaCount = 0;
    cortesiaSales.forEach(sale => {
      const user = sale[1]; // Usuario
      const products = sale[6]; // Productos

      reportSheet.getRange(currentRow, 1).setValue(user);
      reportSheet.getRange(currentRow, 2).setValue(products);

      cortesiaCount++;
      currentRow++;
    });

    // Add total for cortesia sales
    reportSheet.getRange(currentRow, 1).setValue("TOTAL CORTESÍAS");
    reportSheet.getRange(currentRow, 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, 2).setValue(cortesiaCount);
    reportSheet.getRange(currentRow, 2).setFontWeight("bold");
    currentRow += 2; // Add space between sections
  } else {
    // Add a note if there are no cortesia sales
    reportSheet.getRange(currentRow, 1).setValue("NO HAY VENTAS POR CORTESÍA");
    reportSheet.getRange(currentRow, 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, 1).setBackground("#ffcc00");
    currentRow += 2; // Add space between sections
  }

  // Section for pendiente sales
  reportSheet.getRange(currentRow, 1).setValue("VENTAS PENDIENTES");
  reportSheet.getRange(currentRow, 1).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1).setBackground("#ffcc00"); // Yellow background
  reportSheet.getRange(currentRow, 1, 1, 3).merge();
  currentRow++;

  // Add headers for pendiente sales
  const pendienteHeaders = ["Usuario", "Productos", "Nombre Cliente"];
  pendienteHeaders.forEach((header, index) => {
    reportSheet.getRange(currentRow, index + 1).setValue(header);
    reportSheet.getRange(currentRow, index + 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, index + 1).setBackground("#fcd5b4");
  });
  currentRow++;

  // Add pendiente sales data with validation and sorting
  if (pendienteSales.length > 0) {
    // Sort pendiente sales by date (most recent first)
    pendienteSales.sort((a, b) => new Date(b[0]) - new Date(a[0]));

    let pendienteCount = 0;
    pendienteSales.forEach(sale => {
      const user = sale[1]; // Usuario
      const products = sale[6]; // Productos
      const clientName = sale[10]; // Nombre Cliente

      reportSheet.getRange(currentRow, 1).setValue(user);
      reportSheet.getRange(currentRow, 2).setValue(products);
      reportSheet.getRange(currentRow, 3).setValue(clientName);

      pendienteCount++;
      currentRow++;
    });

    // Add total for pendiente sales
    reportSheet.getRange(currentRow, 1).setValue("TOTAL PENDIENTES");
    reportSheet.getRange(currentRow, 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, 2).setValue(pendienteCount);
    reportSheet.getRange(currentRow, 2).setFontWeight("bold");
    currentRow++;
  } else {
    // Add a note if there are no pendiente sales
    reportSheet.getRange(currentRow, 1).setValue("NO HAY VENTAS PENDIENTES");
    reportSheet.getRange(currentRow, 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, 1).setBackground("#ffcc00");
    currentRow++;
  }

  // Format the report
  reportSheet.getRange(1, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(1, 1).setFontSize(14);
  reportSheet.getRange(1, 1).setFontWeight("bold");
  reportSheet.getRange(1, 1).setHorizontalAlignment("center");

  reportSheet.getRange(2, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(2, 1).setFontWeight("bold");
  reportSheet.getRange(2, 1).setHorizontalAlignment("center");

  reportSheet.getRange(3, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(3, 1).setFontWeight("bold");
  reportSheet.getRange(3, 1).setHorizontalAlignment("center");

  // Formatear fila 14 
  reportSheet.getRange(14, 1, 2, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(14, 1).setFontWeight("bold");
  reportSheet.getRange(14, 1).setHorizontalAlignment("center");

  // Formatear fila 27 
  reportSheet.getRange(27, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(27, 1).setFontWeight("bold");
  reportSheet.getRange(27, 1).setHorizontalAlignment("center");

  // Formatear fila 31 
  reportSheet.getRange(31, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(31, 1).setFontWeight("bold");
  reportSheet.getRange(31, 1).setHorizontalAlignment("center");

  // Combinar celdas D16 a O26
  reportSheet.getRange(16, 4, 11, (uniqueCategories.length * paymentMethods.length) - 2).merge();

  // Aplicar bordes a toda la tabla
  const dataRange = reportSheet.getDataRange();
  dataRange.setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Establecer un ancho fijo para todas las columnas
    for (let i = 1; i <= currentColumn - 1; i++) {
      reportSheet.setColumnWidth(i, 100);
    }

  // Set column widths for better readability
  reportSheet.setColumnWidth(1, 150);
  reportSheet.setColumnWidth(2, 100);
  reportSheet.setColumnWidth(3, 80);

  // Apply borders to the entire report table
  const lastRow = reportSheet.getLastRow();
  const lastCol = reportSheet.getLastColumn();
  reportSheet.getRange(4, 1, lastRow - 3, lastCol).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Apply borders to the total income table
  reportSheet.getRange(totalIncomeTableStartRow, 1, currentRow - totalIncomeTableStartRow + 1, 3).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Apply formatting to cortesia and pendiente sales sections
  // Format cortesia sales section
  const cortesiaSectionStartRow = totalIncomeTableStartRow + 3 + orderedPaymentMethods.length + 3; // 3 for spacing, 3 for headers, + length of orderedPaymentMethods
  const cortesiaSectionEndRow = currentRow - 2; // -2 for the spacing after cortesia sales
  reportSheet.getRange(cortesiaSectionStartRow, 1, cortesiaSectionEndRow - cortesiaSectionStartRow + 1, 6).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Format pendiente sales section
  const pendienteSectionStartRow = cortesiaSectionEndRow + 3; // +3 for spacing
  const pendienteSectionEndRow = currentRow - 1; // -1 for the final row
  reportSheet.getRange(pendienteSectionStartRow, 1, pendienteSectionEndRow - pendienteSectionStartRow + 1, 7).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Set column widths for better readability in new sections
  reportSheet.setColumnWidth(4, 120); // Método de Pago
  reportSheet.setColumnWidth(5, 100); // Monto
  reportSheet.setColumnWidth(6, 200); // Productos
  reportSheet.setColumnWidth(7, 100); // Total USD
  reportSheet.setColumnWidth(8, 150); // Nombre Cliente (for pendiente sales)

  Logger.log("Reporte semanal generado exitosamente.");
}

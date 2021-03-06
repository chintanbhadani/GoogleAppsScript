//Set properties in File > Project Properties > Script Properties > Add row

function onOpen() {
  SpreadsheetApp
    .getUi()
    .createMenu('Custom')
    .addItem('Send Test SMS', 'sendSMSTest')
    .addToUi()

} 

function sendSMSTest(){
  sendSMS('Test');
}

function sendSMS(sheetName){
  // Get the properties 
  var prop = PropertiesService.getScriptProperties();
  var username = prop.getProperty('46elksUsername'); 
  var password = prop.getProperty('46elksPassword');
  var spreadsheetUrl = prop.getProperty('spreadsheetUrl');
  var sender = prop.getProperty('46elksSender');
  var auth = Utilities.base64Encode(username + ":" + password);
  
  // Open the requested SpreadSheet and Sheet
  var spreadSheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
  var dataSheet = spreadSheet.getSheetByName(sheetName);
  //var numRows = dataSheet.getLastRow();
  var numRows = getLastRow(dataSheet);
  var numCols = dataSheet.getLastColumn();
  var dataRange = dataSheet.getRange(2, 1, numRows - 1, numCols);
  
  // Create one JavaScript object per row of data.
  var objects = getRowsData(dataSheet, dataRange); 
  
  for (var i = 0; i < objects.length; ++i) {
    // Get a row object
    var rowData = objects[i]; Logger.log(prop);
    if(rowData.phone == ''){ 
      dataSheet.getRange(i+2,numCols).setValue("ERROR: Phone Number is undefined.");
      return;
    }
    var sendTo = formatPhoneNumbers(rowData.phone);
    var todayDate = Utilities.formatDate(new Date(), 'CET', 'yyyy:MM:dd');
    var scheduledDate = todayDate;
    if(rowData.scheduledDate != ''){
      scheduledDate = Utilities.formatDate(rowData.scheduledDate, 'CET', 'yyyy:MM:dd');
    }
    if(scheduledDate == todayDate){
     try {
      UrlFetchApp.fetch("https://api.46elks.com/a1/SMS", {
        "method": "post",
        "headers": { "Authorization": "Basic " + auth },
        "payload": {
          "from" : rowData.volunteer,
          "to" : '+' + sendTo,
          "message" : rowData.text
        }
      });
      // Log message
      dataSheet.getRange(i+2,numCols).setValue('Sent to '+ sendTo + ' at ' + Utilities.formatDate(new Date(), 'CET', 'yyyy:MM:dd hh:mm:ss') + ' from ' + sender);
      } catch (err) {
         dataSheet.getRange(i+2,numCols).setValue(String(err).replace('\n', ''));
      }      
    }
  }
}

/**
 * format phone numbers by removing all non-numeric characters and leading zeros
 * @param {string} user entered phone number to be formatted
 */
function formatPhoneNumbers(numRaw){
  numRaw = numRaw.toString();
  var num = numRaw.replace(/[^\d]/g, ""); // Removes all not numeric characters 
  var num = num.replace(/^[^1-9]+/g, ""); // Removes all leading zeros
  return num;
}

// getRowsData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
// - sheet: the sheet object that contains the data to be processed
// - range: the exact range of cells where the data is stored
// - columnHeadersRowIndex: specifies the row number where the column names are stored.
// This argument is optional and it defaults to the row immediately above range;
// Returns an Array of objects.
function getRowsData(sheet, range, columnHeadersRowIndex) {
    columnHeadersRowIndex = columnHeadersRowIndex || range.getRowIndex() - 1;
    var numColumns = range.getEndColumn() - range.getColumn() + 1;
    var headersRange = sheet.getRange(columnHeadersRowIndex, range.getColumn(), 1, numColumns);
    var headers = headersRange.getValues()[0];
    return getObjects(range.getValues(), normalizeHeaders(headers));
}

// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
// - data: JavaScript 2d array
// - keys: Array of Strings that define the property names for the objects to create
function getObjects(data, keys) {
    var objects = [];
    for (var i = 0; i < data.length; ++i) {
        var object = {};
        var hasData = false;
        for (var j = 0; j < data[i].length; ++j) {
            var cellData = data[i][j];
            // if (isCellEmpty(cellData)) {
            // continue;
            // }
            object[keys[j]] = cellData;
            hasData = true;
        }
        if (hasData) {
            objects.push(object);
        }
    }
    return objects;
}

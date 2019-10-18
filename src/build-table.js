import sketch from "sketch";
// documentation: https://developer.sketchapp.com/reference/api/
import Papa from "papaparse";
// documentation: https://www.npmjs.com/package/papaparse
import dialog from "@skpm/dialog";
// documentation: https://github.com/skpm/dialog
const fs = require("@skpm/fs");
// documentation: https://www.npmjs.com/package/@skpm/fs

var document = sketch.getSelectedDocument();

var selectedLayers = document.selectedLayers;
var selectedCount = selectedLayers.length;
var tileName = "tile";

var csvData;

var symbols = document.getSymbols();
var typeSymbols = {};

// load all the symbols up into an object for easy reference
// TODO need handling for duplicate symbol names generally, but not today
symbols.forEach(symbol => {
  typeSymbols[symbol.name] = {
    symbolId: symbol.symbolId
  };
  console.log("found symbol: " + symbol.name);
});

console.log("pre file read");

var fileCnts = fs.readFileSync(
  dialog.showOpenDialog({
    message: "Select Source CSV",
    properties: ["openFile"]
  })[0],
  "utf8"
);
console.log("fileCnts: " + fileCnts);

// var exportOptions = {
//   output: dialog.showOpenDialog({
//     message: "Select Output Directory",
//     properties: ["openDirectory", "createDirectory"]
//   })[0],
//   scales: "2"
// };

/*

TODO
X fix loop
X enable finder based import file selection
X enable finder based file export destination
X symbol overrides via CSV
- match column name to override name
- fix plugin losing document context on sketch blur event

*/

Papa.parse(fileCnts, {
  header: false,
  complete: function(results) {
    csvData = results.data;
    console.log("finished parse! : " + csvData);
    // exportTiles();
  }
});

function exportTiles() {
  if (selectedCount === 0) {
    sketch.UI.alert("Error", "⛔️ No Layers are selected");
  } else {
    // loop through CSV, array[0] is the headers, so skip that
    for (var j = 1; j < csvData.length; j++) {
      var label = csvData[j][0]; // change text label
      var type = csvData[j][1]; // /change symbol override

      // the file name becomes a combination of column entries to ensure it's unique
      var fileName = csvData[j][0] + " " + csvData[j][1];

      // cleanup the file name
      // https://stackoverflow.com/questions/441018/replacing-spaces-with-underscores-in-javascript
      fileName = fileName
        .toLowerCase()
        .replace("/", "-")
        .replace(/ /g, "_");

      selectedLayers.forEach(function(layer, j) {
        // Override Name, TODO match against column names
        // console.log(layer.overrides[0].affectedLayer.name);

        // set the title value
        layer.setOverrideValue(layer.overrides[0], label);

        // set the type value
        layer.setOverrideValue(layer.overrides[1], typeSymbols[type].symbolId);

        // set the layer name which sets the export file name
        layer.name = fileName;

        sketch.export(layer, exportOptions);

        // remove the "@2x" suffix from the exported PNGs
        // https://sketchplugins.com/d/929-change-name-while-exporting-layer
        var baseFilePath = exportOptions.output + "/" + fileName;
        // console.log( baseFilePath +'@2x.png');
        NSFileManager.defaultManager().moveItemAtPath_toPath_error(
          baseFilePath + "@2x.png",
          baseFilePath + ".png",
          nil
        );

        // reset
        layer.name = tileName;
      });
    }

    sketch.UI.alert(
      "Export Complete",
      "Check the folder you selected for export and enjoy your fresh, fresh tiles."
    );
  }
}

export default function() {
  sketch.UI.message("Running...");
}

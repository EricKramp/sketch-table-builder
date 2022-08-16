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

/*

TODO
- match column name to override name
- fix plugin losing document context on sketch blur event

*/

function loadCSV() {
  var fileCnts = fs.readFileSync(
    dialog.showOpenDialog({
      message: "Select Source CSV",
      properties: ["openFile"]
    })[0],
    "utf8"
  );
  console.log("fileCnts: " + fileCnts);

  Papa.parse(fileCnts, {
    header: false,
    complete: function(results) {
      csvData = results.data;
      console.log("finished parse! : " + csvData);
      createTable();
    }
  });
}

function createTable() {
  // loop through CSV
  for (var row = 0; row < csvData.length; row++) {
    console.log("row: " + row);
    for (var col = 0; col < csvData[row].length; col++) {
      console.log(csvData[row][col]);
      var label = csvData[row][col]; // change text label

      selectedLayers.forEach(function(layer) {
        // if we're not on the very first cell, then duplicate the first cell to create a new one
        var newLayer = row === 0 && col === 0 ? layer : layer.duplicate();

        newLayer.frame.x += newLayer.frame.width * col;
        newLayer.frame.y += newLayer.frame.height * row;

        // set the title value
        newLayer.sketchObject.ensureDetachHasUpdated(); // This is a workaround for a bug in Sketch 91
        newLayer.setOverrideValue(newLayer.overrides[0], label);

        // set the newLayer name which sets the export file name
        newLayer.name = label;
      });
    }
  }

  sketch.UI.message("Finished Building Table");
}

export default function() {
  sketch.UI.message("Running…");
  if (selectedCount === 0) {
    sketch.UI.alert("Error", "⛔️ No Layers are selected");
  } else {
    loadCSV();
  }
}

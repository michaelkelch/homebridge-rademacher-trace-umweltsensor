const fs = require("fs");
const fetch = require("node-fetch");

var now = new Date();

main("http://192.168.0.172/devices", 90000);

function main(adresse, intervall) {
  // Parameter:  IPadresse des ArdemacherHomepoliot und Ausgabeintervall in mSeC
  fetch(adresse)
    .then((response) => response.json())
    .then((data) => {
      let devices = data.payload.devices;
      //   Main:
      //     liesst die komplette Liste der Devices aus dem Homepiloten aus
      //     schaut, ob es einen Umweltsensor in der Installation gibt ("PROD_CODE_DEVICE-LOC" = "32000064_S"
      //
      //         wir unterstellen, das unter der Adresse ein RademacherHomepilot intalliert ist
      //         bislang kien Errorhandling falls dies nicht der Fall ist
      //
      //         Überprüft die übergegebenen Adresse ob auf Vorhandensein eines Umweltsensors
      //
      //         i,j werden durchlaufen und beim "i-ten" device  an der "j-ten" capability
      //            der Code des Umweltsensors (32000064_S) gefunden
      //
      //         dann wird unter i,j "weiter unten" in den Capabilities (hier wird das offset "k" hochgezählt ,
      //            der Eintrag für den aktuellen Temperaturwert gesucht ("TEMP_CURR_DEG_MEA)"
      //              gefunden wird der bei "-iten" Device an der "j+k-ten" Capability
      //
      //         danach wird zur Ausgabe in den Logfile die Funktion "writeSensorData" aufgerufen

      for (let i = 0; i < devices.length; i++) {
        for (let j = 0; j < devices[i].capabilities.length; j++) {
          if (devices[i].capabilities[j].value === "32000064_S") {
            console.log("Umweltsensor gefunden!");

            // writeSensorData liesst jeweils einen neuen komplette Datensatz und schreibt die Ergebnisse in den CSV
            //   File

            for (let k = 1; k < 7; k++) {
              if (devices[i].capabilities[j + k].name === "TEMP_CURR_DEG_MEA") {
                setInterval(function () {
                  writeSensorData(i, j, k, adresse);
                }, intervall);
              }
            }
          }
        }
      }
    });
}

function writeSensorData(i, j, k, adresse) {
  fetch(adresse)
    .then((response) => response.json())
    .then((data) => {
      let devices = data.payload.devices;

      let now = new Date();
      console.log(
        "Außentemperatur gemäß Umweltsensor: " +
          devices[i].capabilities[j + k].value +
          now.toTimeString()
      );

      fs.appendFile(
        "temperatur.csv",
        devices[i].capabilities[j + k].value.replace(".", ",") +
          ";" +
          now.toTimeString().slice(0, 8) +
          ";" +
          now.toDateString() +
          "\n",
        function (err) {
          if (err) throw err;
        }
      );
    });
}

// UUIDs müssen genau gleich sein wie im ESP32 Arduino Code
const SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
const CHAR_UUID    = "87654321-4321-4321-4321-cba987654321";

let bleDevice = null;
let bleChar = null;

// quick helper
function $(id) {
  return document.getElementById(id);
}

function log(text) {
  const time = new Date().toLocaleTimeString();
  $("logBox").textContent = `[${time}] ${text}\n` + $("logBox").textContent;
}

function setStatus(text, mode) {
  $("statusText").textContent = text;

  // dot reset
  $("statusDot").className = "dot";
  if (mode === "ok") $("statusDot").classList.add("ok");
  if (mode === "bad") $("statusDot").classList.add("bad");
}

function enableButtons(on) {
  $("btnLed1").disabled = !on;
  $("btnLed2").disabled = !on;
  $("btnOff").disabled = !on;
}

async function connectBluetooth() {
  // wenn browser kein web bluetooth kann
  if (!("bluetooth" in navigator)) {
    setStatus("Web Bluetooth geht hier nicht", "bad");
    log("Nutze Chrome/Edge und öffne über http://localhost (nicht file://).");
    return;
  }

  try {
    setStatus("Suche ESP32…", "");
    log("Bluetooth Fenster sollte jetzt aufgehen…");

    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    bleDevice.addEventListener("gattserverdisconnected", () => {
      setStatus("Getrennt", "bad");
      enableButtons(false);
      $("btnConnect").disabled = false;
      log("Verbindung verloren.");
    });

    setStatus("Verbinde…", "");
    const server = await bleDevice.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    bleChar = await service.getCharacteristic(CHAR_UUID);

    setStatus("Verbunden ✅", "ok");
    log("Connected mit: " + (bleDevice.name || "unknown"));
    enableButtons(true);
    $("btnConnect").disabled = true;

  } catch (err) {
    setStatus("Nicht verbunden", "bad");

    if (err && err.name === "NotFoundError") {
      log("Du hast abgebrochen.");
    } else {
      log("Fehler: " + (err?.message || err));
    }
  }
}

async function sendValue(val) {
  if (!bleChar) {
    log("Nicht verbunden.");
    return;
  }

  try {
    // wir schicken strings "1", "2", "0"
    await bleChar.writeValue(new TextEncoder().encode(val));
    log("Gesendet: " + val);
  } catch (err) {
    log("Senden ging nicht: " + (err?.message || err));
  }
}

// Buttons
$("btnConnect").addEventListener("click", connectBluetooth);
$("btnLed1").addEventListener("click", () => sendValue("1"));
$("btnLed2").addEventListener("click", () => sendValue("2"));
$("btnOff").addEventListener("click", () => sendValue("0"));

// Start
setStatus("Nicht verbunden", "");
enableButtons(false);
log("Ready. Klick auf Verbinden.");

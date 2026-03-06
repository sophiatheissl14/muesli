// UUIDs müssen zu deinem ESP32 Code passen
const SERVICE_UUID = "2f14f151-9f34-40c7-ac5e-1d614e8c7353";
const CHAR_UUID    = "87654321-4321-4321-4321-cba987654321";

let device, server, service, characteristic;

const statusEl = document.getElementById("status");
const btnConnect = document.getElementById("btnConnect");
const btns = [1,2,3,4,5,6].map(n => document.getElementById("btn"+n));
const btnStop = document.getElementById("btnStop");

function setEnabled(enabled) {
  btns.forEach(b => b.disabled = !enabled);
  btnStop.disabled = !enabled;
}

async function connect() {
  try {
    statusEl.textContent = "Status: suche Gerät...";
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    statusEl.textContent = "Status: verbinde...";
    server = await device.gatt.connect();
    service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHAR_UUID);

    statusEl.textContent = "Status: verbunden mit " + (device.name || "ESP32");
    setEnabled(true);
  } catch (e) {
    statusEl.textContent = "Status: Fehler / abgebrochen";
    console.error(e);
  }
}

async function sendValue(val) {
  if (!characteristic) return;
  const data = new TextEncoder().encode(val); // "1".."6" oder "0"
  await characteristic.writeValue(data);
  statusEl.textContent = "Gesendet: " + val;
}

btnConnect.addEventListener("click", connect);

btns.forEach((b, i) => {
  b.addEventListener("click", () => sendValue(String(i+1)));
});
btnStop.addEventListener("click", () => sendValue("0"));

setEnabled(false);

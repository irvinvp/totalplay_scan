const ping = require("ping");
const net = require("net");

const startIP = "10.240.100.1";
const endIP = "10.240.120.255";
const targetPort = 80;

function pingIP(ip) {
  return new Promise((resolve, reject) => {
    ping.sys.probe(ip, (isAlive) => {
      resolve(isAlive);
    });
  });
}

function checkPort(ip, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(2000); // Establece un tiempo de espera de 2 segundos para la conexión
    socket.on("connect", () => {
      socket.destroy(); // Cierra la conexión
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy(); // Cierra la conexión
      resolve(false);
    });
    socket.on("error", (error) => {
      socket.destroy(); // Cierra la conexión
      resolve(false);
    });
    socket.connect(port, ip);
  });
}

async function main() {
  const ipList = [];

  // Generar lista de IP
  const startOctets = startIP.split(".").map(Number);
  const endOctets = endIP.split(".").map(Number);

  for (let a = startOctets[0]; a <= endOctets[0]; a++) {
    for (let b = startOctets[1]; b <= endOctets[1]; b++) {
      for (let c = startOctets[2]; c <= endOctets[2]; c++) {
        for (let d = startOctets[3]; d <= endOctets[3]; d++) {
          ipList.push(`${a}.${b}.${c}.${d}`);
        }
      }
    }
  }

  // Realizar pings y verificar puerto
  let maxConcurrent = 100;
  let promises = [];
  let promiseResults = [];
  let ip_list = [];
  for (const ip of ipList) {
    ip_list.push(ip);
    //console.log(`Verificando IP: ${ip}`);
    promises.push(pingIP(ip));
    if (promises.length >= maxConcurrent) {
      promises = await Promise.all(promises);
      let i = 0;
      let ip_list2 = [];
      let ip_noviva = {};
      for (let promise of promises) {
        if (promise) {
          //console.log(`IP: ${ip_list[i]} está viva`);
          promiseResults.push(checkPort(ip_list[i], targetPort));
          ip_list2.push(ip_list[i]);
        } else {
          //console.log(`IP: ${ip_list[i]} no está viva`);
          promiseResults.push(checkPort(ip_list[i], targetPort));
          ip_list2.push(ip_list[i]);
          ip_noviva[ip_list[i]] = true;
        }
        i++;
      }
      promiseResults = await Promise.all(promiseResults);
      let j = 0;
      for (let result of promiseResults) {
        if (result) {
          if (ip_noviva[ip_list2[j]] == true) {
            console.log(
              `IP: ${ip_list2[j]} tiene el puerto ${targetPort} abierto sin IP viva`
            );
          } else {
            console.log(
              `IP: ${ip_list2[j]} tiene el puerto ${targetPort} abierto`
            );
          }
        }
        j++;
      }
      promises = [];
      ip_list = [];
      promiseResults = [];
    }
  }
}

main().catch(console.error);

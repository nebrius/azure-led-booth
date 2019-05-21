"use strict";
/*
MIT License

Copyright (c) Bryan Hughes <bryan@nebri.us>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const azure_iot_device_1 = require("azure-iot-device");
const azure_iot_device_mqtt_1 = require("azure-iot-device-mqtt");
const rvl_node_1 = require("rvl-node");
const equals = require("deep-equal");
const common_1 = require("./common/common");
const IOT_HUB_DEVICE_CONNECTION_STRING = common_1.getEnvironmentVariable('IOT_HUB_DEVICE_CONNECTION_STRING');
const RAVER_LIGHTS_INTERFACE = common_1.getEnvironmentVariable('RAVER_LIGHTS_INTERFACE');
const rvl = new rvl_node_1.RVL({
    networkInterface: RAVER_LIGHTS_INTERFACE,
    port: 4978,
    mode: 'controller',
    logLevel: 'debug'
});
function connectToIoTHub() {
    console.log('Connecting to IoT Hub...');
    const client = azure_iot_device_1.Client.fromConnectionString(IOT_HUB_DEVICE_CONNECTION_STRING, azure_iot_device_mqtt_1.Mqtt);
    client.open((openErr) => {
        if (openErr) {
            console.error(openErr);
            console.error('Could not open the connection to IoT Hub, exiting');
            process.exit(-1);
        }
        client.on('error', (err) => console.error(err));
        client.on('disconnect', () => {
            console.warn('Disconnected from IoT Hub, reconnecting...');
            client.removeAllListeners();
            setImmediate(connectToIoTHub);
        });
        client.on('message', (msg) => {
            const newConfig = JSON.parse(msg.data.toString());
            if (!equals(rvl.waveParameters, newConfig)) {
                console.log('Setting new wave paramters');
                console.debug(newConfig);
                rvl.setWaveParameters(newConfig);
            }
        });
        console.log('Connected to IoT Hub');
    });
}
console.log('Starting RVL');
rvl.on('initialized', () => {
    rvl.start();
    connectToIoTHub();
});
//# sourceMappingURL=index.js.map
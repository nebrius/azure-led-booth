"use strict";
/*
Copyright (c) Bryan Hughes <bryan@nebri.us>

This file is part of Home Lights.

Home Lights is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Home Lights is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Home Lights.  If not, see <http://www.gnu.org/licenses/>.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const azure_iot_device_1 = require("azure-iot-device");
const azure_iot_device_mqtt_1 = require("azure-iot-device-mqtt");
const rvl_node_1 = require("rvl-node");
const equals = require("deep-equal");
const IOT_HUB_DEVICE_CONNECTION_STRING = process.env.IOT_HUB_DEVICE_CONNECTION_STRING;
if (typeof IOT_HUB_DEVICE_CONNECTION_STRING !== 'string') {
    throw new Error('Environment variable IOT_HUB_DEVICE_CONNECTION_STRING is not defined');
}
const RAVER_LIGHTS_INTERFACE = 'wlan0';
const rvl = new rvl_node_1.RVL({
    networkInterface: RAVER_LIGHTS_INTERFACE,
    port: 4978,
    mode: 'controller',
    logLevel: 'debug'
});
console.log('Starting RVL');
rvl.on('initialized', () => {
    rvl.start();
    console.log('Connecting to IoT Hub');
    const client = azure_iot_device_1.Client.fromConnectionString(IOT_HUB_DEVICE_CONNECTION_STRING, azure_iot_device_mqtt_1.Mqtt);
    client.open((openErr) => {
        if (openErr) {
            console.error(openErr);
            console.error('Could not open the connection to IoT Hub, exiting');
            process.exit(-1);
        }
        client.on('error', (err) => console.error(err));
        client.on('disconnect', () => client.removeAllListeners());
        client.getTwin((getTwinErr, twin) => {
            if (getTwinErr || !twin) {
                console.error(getTwinErr || new Error('Could not get device Twin, exiting'));
                process.exit(-1);
                return;
            }
            twin.properties.reported.config = JSON.stringify({
                animation: rvl.waveParameters
            });
            // Read configuration changes from the cloud to the device
            twin.on('properties.desired', (desiredChange) => {
                // Validate the incoming data and see if there are any changes, if so save it
                const newConfig = JSON.parse(desiredChange.config);
                if (!equals(rvl.waveParameters, newConfig.animation)) {
                    rvl.setWaveParameters(newConfig.animation);
                }
                // Check if we don't need to acknowledge receipt of the changes and skip if so
                if (twin.properties.desired.$version === twin.properties.reported.$version) {
                    return;
                }
            });
            console.log('Connected to IoT Hub');
        });
    });
});
//# sourceMappingURL=index.js.map
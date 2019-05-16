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

import { Client } from 'azure-iot-device';
import { Mqtt as Protocol } from 'azure-iot-device-mqtt';
import { RVL, IWaveParameters } from 'rvl-node';
import equals = require('deep-equal');
import { getEnvironmentVariable } from './common/common';

const IOT_HUB_DEVICE_CONNECTION_STRING = getEnvironmentVariable('IOT_HUB_DEVICE_CONNECTION_STRING');
const RAVER_LIGHTS_INTERFACE = getEnvironmentVariable('RAVER_LIGHTS_INTERFACE');

const rvl = new RVL({
  networkInterface: RAVER_LIGHTS_INTERFACE,
  port: 4978,
  mode: 'controller',
  logLevel: 'debug'
});

function connectToIoTHub(): void {
  console.log('Connecting to IoT Hub...');
  const client = Client.fromConnectionString(IOT_HUB_DEVICE_CONNECTION_STRING, Protocol);
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
      const newConfig: IWaveParameters = JSON.parse(msg.data.toString());
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

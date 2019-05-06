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

import { RVL } from 'rvl-node';

const RAVER_LIGHTS_INTERFACE = 'wlan0';

const rvl = new RVL({
  networkInterface: RAVER_LIGHTS_INTERFACE,
  port: 4978,
  mode: 'controller',
  logLevel: 'debug'
});

rvl.on('initialized', () => {
  rvl.start();
  // TODO: listen for messages here
});

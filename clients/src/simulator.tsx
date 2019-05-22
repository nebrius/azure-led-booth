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

import * as React from 'react';
import { render } from 'react-dom';
import { AppComponent, IColor } from './components/simulator-app';
import { IWaveParameters } from 'rvl-node-types';
import { createWaveParameters, createSolidColorWave } from 'rvl-node-animations';

const startTime = Date.now();
let waveParameters: IWaveParameters = createWaveParameters(createSolidColorWave(0, 0, 0, 255));

function onWaveParametersUpdated(newWaveParameters: IWaveParameters) {
  waveParameters = newWaveParameters;
}

function renderApp(colors: IColor[]) {
  render(
    (
      <AppComponent colors={colors} waveParameters={waveParameters} onWaveParametersUpdated={onWaveParametersUpdated} />
    ),
    document.getElementById('app')
  );
}

setInterval(() => {
  const animationTime = Date.now() - startTime;
  const colors: IColor[] = [
    { hue: 0, saturation: 100, value: 100 },
    { hue: 12, saturation: 100, value: 100 },
    { hue: 24, saturation: 100, value: 100 },
    { hue: 36, saturation: 100, value: 100 },
    { hue: 48, saturation: 100, value: 100 },
    { hue: 60, saturation: 100, value: 100 },
    { hue: 72, saturation: 100, value: 100 },
    { hue: 84, saturation: 100, value: 100 },
    { hue: 96, saturation: 100, value: 100 },
    { hue: 108, saturation: 100, value: 100 },
    { hue: 120, saturation: 100, value: 100 },
    { hue: 132, saturation: 100, value: 100 },
    { hue: 144, saturation: 100, value: 100 },
    { hue: 156, saturation: 100, value: 100 },
    { hue: 168, saturation: 100, value: 100 },
    { hue: 180, saturation: 100, value: 100 },
    { hue: 192, saturation: 100, value: 100 },
    { hue: 204, saturation: 100, value: 100 },
    { hue: 216, saturation: 100, value: 100 },
    { hue: 228, saturation: 100, value: 100 },
    { hue: 240, saturation: 100, value: 100 },
    { hue: 252, saturation: 100, value: 100 },
    { hue: 264, saturation: 100, value: 100 },
    { hue: 276, saturation: 100, value: 100 }
  ];
  console.log(animationTime);

  renderApp(colors);
}, 33);

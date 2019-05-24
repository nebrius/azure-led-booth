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
import { createWaveParameters, createMovingWave, createSolidColorWave } from 'rvl-node-animations';
import { hsv } from 'color-convert';
import { init } from './calculatePixelValue';

const LED_NUM_PIXELS = 64;
const NUM_WAVES = 4;

const startTime = Date.now();
let waveParameters: IWaveParameters = createWaveParameters(
  createMovingWave(0, 255, 8, 16),
  createSolidColorWave(128, 255, 255, 255)
);

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

function blend(color1: number, color2: number, alpha: number): number {
  alpha = alpha / 255;
  color1 = color1 / 255;
  color2 = color2 / 255;
  return Math.round(255 * (color1 * alpha + color2 * (1 - alpha)));
}

init().then((calculatePixelValue) => {
  setInterval(() => {
    const animationClock = Date.now() - startTime;
    if (!waveParameters.timePeriod) {
      waveParameters.timePeriod = 255;
    }
    if (!waveParameters.distancePeriod) {
      waveParameters.distancePeriod = 32;
    }
    const colors: IColor[] = [];
    const t = animationClock % 25500;
    for (let i = 0; i < LED_NUM_PIXELS; i++) {
      const pixelColorLayers: IColor[] = [];
      const alphaValuesLayers: number[] = [];

      for (let j = 0; j < NUM_WAVES; j++) {
        const pixelColor = hsv.rgb([
          Math.round(calculatePixelValue(
            waveParameters.waves[j].h.a,
            waveParameters.waves[j].h.w_t,
            waveParameters.waves[j].h.w_x,
            waveParameters.waves[j].h.phi,
            waveParameters.waves[j].h.b,
            t,
            i) * 360 / 255),
          Math.round(calculatePixelValue(
            waveParameters.waves[j].s.a,
            waveParameters.waves[j].s.w_t,
            waveParameters.waves[j].s.w_x,
            waveParameters.waves[j].s.phi,
            waveParameters.waves[j].s.b,
            t,
            i) * 100 / 255),
          Math.round(calculatePixelValue(
            waveParameters.waves[j].v.a,
            waveParameters.waves[j].v.w_t,
            waveParameters.waves[j].v.w_x,
            waveParameters.waves[j].v.phi,
            waveParameters.waves[j].v.b,
            t,
            i) * 100 / 255)
        ]);
        pixelColorLayers[j] = {
          r: pixelColor[0],
          g: pixelColor[1],
          b: pixelColor[2]
        };
        alphaValuesLayers[j] = calculatePixelValue(
          waveParameters.waves[j].a.a,
          waveParameters.waves[j].a.w_t,
          waveParameters.waves[j].a.w_x,
          waveParameters.waves[j].a.phi,
          waveParameters.waves[j].a.b,
          t,
          i);
      }
      colors[i] = pixelColorLayers[NUM_WAVES - 1];
      for (let j = NUM_WAVES - 2; j >= 0; j--) {
        colors[i] = {
          r: blend(colors[i].r, pixelColorLayers[j].r, alphaValuesLayers[j]),
          g: blend(colors[i].g, pixelColorLayers[j].g, alphaValuesLayers[j]),
          b: blend(colors[i].b, pixelColorLayers[j].b, alphaValuesLayers[j]),
        };
      }
    }
    renderApp(colors);
  }, 33);
});

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
import { ControlsComponent } from './simulator-controls';
import { DisplayComponent } from './simulator-display';
import { IWaveParameters } from 'rvl-node-types';

interface IAppComponentState {
  waveParameters: IWaveParameters;
}

export class AppComponent extends React.Component<{}, IAppComponentState> {

  public state = {
    waveParameters: {
      waves: []
    }
  };

  public render() {
    return (
      <div className="app">
        <header className="header"><h1>Azure LED Simulator</h1></header>
        <ControlsComponent
          waveParameters={this.state.waveParameters}
          onWaveParametersUpdated={this._onWaveParamtersUpdated} />
        <DisplayComponent
          waveParameters={this.state.waveParameters} />
      </div>
    );
  }

  private _onWaveParamtersUpdated = (waveParameters: IWaveParameters) => {
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        waveParameters
      };
      return newState;
    });
  }
}

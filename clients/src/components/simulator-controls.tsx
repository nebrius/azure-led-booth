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
import { api } from '../util';
import { IWaveParameters } from 'rvl-node-types';

interface IControlsComponentProps {
  onWaveParametersUpdated: (waveParamters: IWaveParameters) => void;
  waveParameters: IWaveParameters;
}

interface IControlsComponentState {
  functionUrl: string;
}

export class ControlsComponent extends React.Component<IControlsComponentProps, IControlsComponentState> {

  public state = {
    functionUrl: ''
  };

  public render() {
    return (
      <div className="controls">
        <h3>Your Function details</h3>
        <form className="controls-form" onSubmit={this._handleSubmit}>
          <label htmlFor="displayNameInput">Azure Function Endpoint:</label>
          <input
            type="text"
            id="displayNameInput"
            value={this.state.functionUrl}
            onChange={this._handleFunctionUrlChanged} />

          <div>
            <button type="submit">Run</button>
          </div>
        </form>
        <h3>Your Wave Parameters</h3>
        <pre className="controls-parameters">{JSON.stringify(this.props.waveParameters, null, '  ')}</pre>
      </div>
    );
  }

  private _handleFunctionUrlChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const functionUrl = event.currentTarget.value;
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        functionUrl
      };
      return newState;
    });
  }

  private _handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const waveParameters = await api('submit-simulation', 'POST', this.state);
    this.props.onWaveParametersUpdated(waveParameters);
  }
}

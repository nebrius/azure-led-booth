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
import { IBasicSubmission } from '../common/common';
import { api, updateQueue } from '../util';

export class SubmissionComponent extends React.Component<{}, IBasicSubmission> {

  public state = {
    foregroundColor: '#00ff00',
    backgroundColor: '#0000ff',
    rate: 8,
    displayName: ''
  };

  public render() {
    return (
      <div className="submission">
        <div className="submission-header"><h2>New Submission</h2></div>
        <form className="submission-form" onSubmit={this._handleSubmit}>
          <label htmlFor="foregroundColorInput">Foreground Color:</label>
          <input
            type="color"
            id="foregroundColorInput"
            value={this.state.foregroundColor}
            onChange={this._handleForegroundColorChanged} />

          <label htmlFor="backgroundColorInput">Background Color:</label>
          <input
            type="color"
            id="foregroundColorInput"
            value={this.state.backgroundColor}
            onChange={this._handleBackgroundColorChanged} />

          <label htmlFor="rateInput">Rate:</label>
          <input
            type="range"
            id="rateInput"
            min={1}
            max={32}
            value={this.state.rate}
            onChange={this._handleRateChanged} />

          <label htmlFor="displayNameInput">Display Name:</label>
          <input
            type="text"
            id="displayNameInput"
            value={this.state.displayName}
            onChange={this._handleDisplayNameChanged} />

          <div>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    );
  }

  private _handleForegroundColorChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const foregroundColor = event.currentTarget.value;
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        foregroundColor
      };
      return newState;
    });
  }

  private _handleBackgroundColorChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const backgroundColor = event.currentTarget.value;
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        backgroundColor
      };
      return newState;
    });
  }

  private _handleRateChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const rate = parseInt(event.currentTarget.value, 10);
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        rate
      };
      return newState;
    });
  }

  private _handleDisplayNameChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const displayName = event.currentTarget.value;
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        displayName
      };
      return newState;
    });
  }

  private _handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await api('submit-basic', 'POST', this.state);
    updateQueue();
  }

}

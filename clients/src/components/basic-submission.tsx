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
import { reduce } from 'conditional-reduce';

const BANNER_TIMEOUT = 15 * 1000;

enum State {
  none = 'none',
  saving = 'saving',
  success = 'success',
  error = 'error'
}

interface ISubmissionComponentState {
  submission: IBasicSubmission;
  state: State;
  stateError?: string;
}

export class SubmissionComponent extends React.Component<{}, ISubmissionComponentState> {

  public state = {
    submission: {
      foregroundColor: '#00ff00',
      backgroundColor: '#0000ff',
      rate: 8,
      displayName: ''
    },
    state: State.none,
    stateError: ''
  };

  public render() {
    return (
      <div className="submission">
        <div className="submission-header"><h2>New Submission</h2></div>
        {reduce(this.state.state, {
          [State.none]: () => (
            <div></div>
          ),
          [State.error]: () => (
            <div className="banner-error basic-banner">{this.state.stateError}</div>
          ),
          [State.success]: () => (
            <div className="banner-success basic-banner">Your submission has been queued up!</div>
          ),
          [State.saving]: () => (
            <div className="banner-saving basic-banner">Submitting your submission...</div>
          )
        })}
        <form className="submission-form" onSubmit={this._handleSubmit}>
          <label htmlFor="foregroundColorInput">Foreground Color:</label>
          <input
            type="color"
            id="foregroundColorInput"
            value={this.state.submission.foregroundColor}
            onChange={this._handleForegroundColorChanged} />

          <label htmlFor="backgroundColorInput">Background Color:</label>
          <input
            type="color"
            id="foregroundColorInput"
            value={this.state.submission.backgroundColor}
            onChange={this._handleBackgroundColorChanged} />

          <label htmlFor="rateInput">Rate:</label>
          <input
            type="range"
            id="rateInput"
            min={1}
            max={32}
            value={this.state.submission.rate}
            onChange={this._handleRateChanged} />

          <label htmlFor="displayNameInput">Display Name:</label>
          <input
            type="text"
            id="displayNameInput"
            value={this.state.submission.displayName}
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
        submission: {
          ...previousState.submission,
          foregroundColor
        }
      };
      return newState;
    });
  }

  private _handleBackgroundColorChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const backgroundColor = event.currentTarget.value;
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        submission: {
          ...previousState.submission,
          backgroundColor
        }
      };
      return newState;
    });
  }

  private _handleRateChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const rate = parseInt(event.currentTarget.value, 10);
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        submission: {
          ...previousState.submission,
          rate
        }
      };
      return newState;
    });
  }

  private _handleDisplayNameChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const displayName = event.currentTarget.value;
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        submission: {
          ...previousState.submission,
          displayName
        }
      };
      return newState;
    });
  }

  private _setSaveState = (state: State, stateError?: string) => {
    this.setState((previousState) => {
      const newState = {
        ...previousState,
        state,
        stateError
      };
      return newState;
    });
  }

  private _handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this._setSaveState(State.saving);
    try {
      await api('submit-basic', 'POST', this.state.submission);
      updateQueue();
      this._setSaveState(State.success);
    } catch (e) {
      this._setSaveState(State.error, e.message);
    } finally {
      setTimeout(() => this._setSaveState(State.none), BANNER_TIMEOUT);
    }
  }

}

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

import { IWaveParameters } from './IWaves';

// This is what's sent from the Browser Submission to the server to add to the queue
export interface ICustomSubmission {
  displayName: string;
  functionUrl: string;
}

// This is what's returned from the user's Azure Function when we're ready to display their animation
export interface ICustomSubmissionResponse {
  authToken: string;
  waveParameters: IWaveParameters;
}

// Force to "any" type, otherwise TypeScript thinks the type is too strict and won't ever compile
export const customSubmissionSchema: any = {
  properties: {
    functionUrl: {
      type: 'string',
      pattern: '^https\:\/\/[a-zA-Z0-9\-]*?\.azurewebsites\.net\/.*$',
      required: true
    },
    displayName: {
      type: 'string',
      required: true
    },
  }
};

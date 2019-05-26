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

import { IWaveParameters } from 'rvl-node-types';

// This is what's sent from the Azure Function creator's browser to the server to add to the queue
export interface ICustomSubmission {
  displayName: string;
  apiKey: string;
  functionUrl: string;
}

// This is what's returned from the user's Azure Function when we're ready to display their animation
export interface ICustomSubmissionResponse {
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
    apiKey: {
      type: 'string',
      required: false
    }
  }
};

// Force to "any" type, otherwise TypeScript thinks the type is too strict and won't ever compile
export const customSubmissionResponseSchema: any = {
  properties: {
    waveParameters: {
      type: 'object',
      properties: {
        timePeriod: {
          type: 'number',
          multipleOf: 1.0,
          minimum: 1,
          maximum: 32,
          required: false
        },
        distancePeriod: {
          type: 'number',
          multipleOf: 1.0,
          minimum: 1,
          maximum: 16,
          required: false
        },
        waves: {
          required: true,
          type: 'array',
          minItems: 1,
          maxItems: 4,
          definitions: {
            channel: {
              type: 'object',
              properties: {
                a: {
                  type: 'number',
                  multipleOf: 1.0,
                  minimum: 0,
                  maximum: 255
                },
                w_x: {
                  type: 'number',
                  multipleOf: 1.0,
                  minimum: 0,
                  maximum: 255
                },
                w_t: {
                  type: 'number',
                  multipleOf: 1.0,
                  minimum: 0,
                  maximum: 255
                },
                phi: {
                  type: 'number',
                  multipleOf: 1.0,
                  minimum: 0,
                  maximum: 255
                },
                b: {
                  type: 'number',
                  multipleOf: 1.0,
                  minimum: 0,
                  maximum: 255
                }
              }
            }
          },
          items: {
            type: 'object',
            properties: {
              h: { $ref: 'channel' },
              s: { $ref: 'channel' },
              v: { $ref: 'channel' },
              a: { $ref: 'channel' },
            }
          }
        }
      },
      required: true
    }
  }
};

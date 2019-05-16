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

import { AzureFunction, Context } from '@azure/functions';
import { createQueueService } from 'azure-storage';
import { getEnvironmentVariable, IQueueEntry, QueueType, IBasicQueueEntry, ICustomQueueEntry } from './common/common';
import { IWaveParameters } from 'rvl-node-types';
import { createWaveParameters, createMovingWave, createSolidColorWave } from 'rvl-node-animations';
import { rgb } from 'color-convert';

const AZURE_STORAGE_QUEUE_NAME = getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_CONNECTION_STRING = getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');

type ErrorCallback = (err: Error | undefined) => void;

interface ITimerRequest {
  IsPastDue: boolean;
}

function sendAnimation(animation: IWaveParameters, cb: ErrorCallback): void {
  // TODO
}

const COLOR_REGEX = /^\#([0-9][0-9])([0-9][0-9])([0-9][0-9])$/;
function parseColor(str: string): { h: number, s: number, v: number } {
  const color = COLOR_REGEX.exec(str);
  if (!color) {
    throw new Error(`Invalid color string ${str}`);
  }
  const [ , r, g, b] = color;
  const [ h, s, v ] = rgb.hsv([ parseInt(r, 16), parseInt(g, 16), parseInt(b, 16) ]);
  return {
    h: Math.round(255 * h / 360),
    s: Math.round(255 * s / 100),
    v: Math.round(255 * v / 100)
  };
}

function processBasicAnimation(entry: IBasicQueueEntry, cb: ErrorCallback): void {
  const foregroundColor = parseColor(entry.submission.foregroundColor);
  const backgroundColor = parseColor(entry.submission.backgroundColor);
  if (!foregroundColor) {
    cb(new Error(`Invalid foreground color ${foregroundColor}`));
    return;
  }
  if (!backgroundColor) {
    cb(new Error(`Invalid background color ${backgroundColor}`));
    return;
  }
  const rate = entry.submission.rate;
  const animation = createWaveParameters(
    // Create the moving wave on top
    createMovingWave(foregroundColor.h, foregroundColor.s, rate, 2),

    // Create the solid color on bottom
    createSolidColorWave(backgroundColor.h, backgroundColor.s, backgroundColor.v, 255)
  );
  sendAnimation(animation, cb);
}

function processCustomAnimation(entry: ICustomQueueEntry, cb: ErrorCallback): void {
  // TODO
}

const prcoessQueueTrigger: AzureFunction = (context: Context, timer: ITimerRequest): void => {
  const queueService = createQueueService(AZURE_STORAGE_CONNECTION_STRING);
  queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (createErr, createResult, createResponse) => {
    if (createErr) {
      context.done(new Error(`Could not get queue, bailing: ${createErr}`));
      return;
    }

    // Ignore past due timers, because we don't want a rapid succession of animations
    // Better to take too long than too short here.
    if (timer.IsPastDue) {
      context.done(new Error('Timer is past due, skipping this round until the timer infrastructure catches up'));
      return;
    }

    function processMessage(): void {
      // Dequeue the message from the queue, but leave it there. We'll delete it later once we're done processing it.
      // This approach allows us to leave it in the queue but mark it so no one else can process it.
      queueService.getMessage(AZURE_STORAGE_QUEUE_NAME, (getErr, message) => {
        if (getErr) {
          context.done(new Error(`Could not get message, bailing: ${getErr}`));
          return;
        }
        const { messageId, popReceipt, messageText } = message;
        if (typeof messageId !== 'string') {
          context.done('`messageId` is missing in Storage Queue message');
          return;
        }
        if (typeof popReceipt !== 'string') {
          context.done('`popReceipt` is missing in Storage Queue message');
          return;
        }
        if (typeof messageText !== 'string') {
          context.done('`messageText` is missing in Storage Queue message');
          return;
        }

        function finalize(cb: () => void): void {
          // Now that we're done processing, let's remove it from the queue
          queueService.deleteMessage(AZURE_STORAGE_QUEUE_NAME, messageId as string, popReceipt as string, (err) => {
            if (err) {
              context.done(new Error(`Could not delete message, bailing: ${err}`));
              return;
            }
            cb();
          });
        }

        try {
          const entry: IQueueEntry = JSON.parse(messageText);
          context.log(entry);
          switch (entry.type) {
            case QueueType.Basic: {
              processBasicAnimation(entry as IBasicQueueEntry, (err) => {
                if (err) {
                  context.done(new Error(`Could not process basic animation: ${err}`));
                } else {
                  context.done();
                }
              });
              break;
            }
            case QueueType.Custom: {
              processCustomAnimation(entry as ICustomQueueEntry, (err) => {
                if (err) {
                  context.done(new Error(`Could not process basic animation: ${err}`));
                } else {
                  context.done();
                }
              });
              break;
            }
            default: {
              context.log(`Error: invalid animation queue type ${entry.type}, skipping animation`);
              finalize(processMessage);
            }
          }
        } catch (e) {
          context.log(`Error: could not parse message, skipping animation: ${e}`);
          finalize(processMessage);
          return;
        }
      });
    }
    processMessage();
  });
};

export default prcoessQueueTrigger;

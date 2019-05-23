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

import { Client } from 'azure-iothub';
import { AzureFunction, Context } from '@azure/functions';
import { createQueueService } from 'azure-storage';
import { validate } from 'revalidator';
import {
  getEnvironmentVariable,
  IQueueEntry,
  QueueType,
  IBasicQueueEntry,
  ICustomQueueEntry,
  customSubmissionResponseSchema,
  ICustomSubmissionResponse
} from './common/common';
import { IWaveParameters } from 'rvl-node-types';
import { createWaveParameters, createMovingWave, createSolidColorWave, createPulsingWave } from 'rvl-node-animations';
import { rgb } from 'color-convert';
import fetch from 'node-fetch';

const IOT_HUB_CONNECTION_STRING = getEnvironmentVariable('IOT_HUB_CONNECTION_STRING');
const IOT_HUB_DEVICE_ID = getEnvironmentVariable('IOT_HUB_DEVICE_ID');
const AZURE_STORAGE_QUEUE_NAME = getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_CONNECTION_STRING = getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');

interface ITimerRequest {
  IsPastDue: boolean;
}

async function sendAnimation(animation: IWaveParameters) {
  return new Promise((resolve, reject) => {
    const client = Client.fromConnectionString(IOT_HUB_CONNECTION_STRING);
    client.open((openErr) => {
      if (openErr) {
        reject(openErr);
        return;
      }
      client.send(IOT_HUB_DEVICE_ID, JSON.stringify(animation), (sendErr) => {
        if (sendErr) {
          reject(sendErr);
        } else {
          resolve();
        }
      });
    });
  });
}

const COLOR_REGEX = /^\#([0-9a-zA-Z][0-9a-zA-Z])([0-9a-zA-Z][0-9a-zA-Z])([0-9a-zA-Z][0-9a-zA-Z])$/;

function parseColor(str: string): { h: number, s: number, v: number } | undefined {
  const color = COLOR_REGEX.exec(str);
  if (!color) {
    return undefined;
  }
  const [ , r, g, b] = color;
  const [ h, s, v ] = rgb.hsv([ parseInt(r, 16), parseInt(g, 16), parseInt(b, 16) ]);
  return {
    h: Math.round(255 * h / 360),
    s: Math.round(255 * s / 100),
    v: Math.round(255 * v / 100)
  };
}

async function processBasicAnimation(entry: IBasicQueueEntry) {
  const foregroundColor = parseColor(entry.submission.foregroundColor);
  if (!foregroundColor) {
    throw new Error(`Invalid foreground color ${foregroundColor}`);
  }
  const backgroundColor = parseColor(entry.submission.backgroundColor);
  if (!backgroundColor) {
    throw new Error(`Invalid background color ${backgroundColor}`);
  }
  const rate = entry.submission.rate;
  const animation = createWaveParameters(
    // Create the moving wave on top
    createMovingWave(foregroundColor.h, foregroundColor.s, rate, 2),

    // Create the solid color on bottom
    createSolidColorWave(backgroundColor.h, backgroundColor.s, backgroundColor.v, 255)
  );
  await sendAnimation(animation);
}

async function processCustomAnimation(entry: ICustomQueueEntry) {
  const response = await fetch(entry.submission.functionUrl, {
    method: 'POST',
    body: JSON.stringify({
      apiKey: entry.submission.apiKey
    })
  });
  const message: ICustomSubmissionResponse = await response.json();
  if (!validate(message, customSubmissionResponseSchema).valid) {
    throw new Error(`Received invalid response from user Function, skipping: ${JSON.stringify(message, null, '  ')}`);
  }
  await sendAnimation(message.waveParameters);
}

async function processDefaultAnimation() {
  const animation = createWaveParameters(
    // Create the moving wave on top
    createMovingWave(215, 255, 8, 2),

    // Creating a pulsing green on top of the blue, but below the purple
    createPulsingWave(85, 255, 2),

    // Create the solid blue on bottom
    createSolidColorWave(170, 255, 255, 255)
  );
  await sendAnimation(animation);
}

const prcoessQueueTrigger: AzureFunction = (context: Context, timer: ITimerRequest): void => {
  const queueService = createQueueService(AZURE_STORAGE_CONNECTION_STRING);
  context.log('Fetching or creating queue');
  queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (createErr, createResult, createResponse) => {
    if (createErr) {
      context.log(`Could not get queue, bailing: ${createErr}`);
      context.done();
      return;
    }

    // Ignore past due timers, because we don't want a rapid succession of animations
    // Better to take too long than too short here.
    if (timer.IsPastDue) {
      context.log('Timer is past due, skipping this round until the timer infrastructure catches up');
      context.done();
      return;
    }

    function processMessage(): void {
      context.log('Getting the next message from the queue');
      // Dequeue the message from the queue, but leave it there. We'll delete it later once we're done processing it.
      // This approach allows us to leave it in the queue but mark it so no one else can process it.
      queueService.getMessage(AZURE_STORAGE_QUEUE_NAME, (getErr, message) => {
        // This means there was an error getting the messages, and we should report it as an error
        if (getErr) {
          context.log(`Could not get message, bailing: ${getErr}`);
          context.done();
          return;
        }

        // This means there are no messages to get, so let's show the default animation
        if (!message) {
          context.log('No messages in queue, running default animation');
          processDefaultAnimation()
            .then(() => {
              context.log('Default animation sent to the device');
              context.done();
            })
            .catch((err: Error) => {
              context.log(`Could not process default animation, skipping animation: ${err.message}`);
            });
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
              context.log(`Could not delete message, bailing: ${err}`);
              context.done();
              return;
            }
            cb();
          });
        }

        let entry: IQueueEntry;
        try {
          entry = JSON.parse(messageText);
        } catch (e) {
          context.log(`Error: could not parse message, skipping animation: ${e}`);
          finalize(processMessage);
          return;
        }
        switch (entry.type) {
          case QueueType.Basic: {
            context.log('Processing basic animation');
            processBasicAnimation(entry as IBasicQueueEntry)
              .then(() => {
                context.log('Basic animation sent to the device');
                finalize(() => context.done());
              })
              .catch((err: Error) => {
                context.log(`Could not process basic animation, skipping animation: ${err.message}`);
                finalize(processMessage);
              });
            break;
          }
          case QueueType.Custom: {
            context.log('Processing custom animation');
            processCustomAnimation(entry as ICustomQueueEntry)
              .then(() => {
                context.log('Custom animation sent to the device');
                finalize(() => context.done());
              })
              .catch((err: Error) => {
                context.log(`Could not process custom animation, skipping animation: ${err.message}`);
                finalize(processMessage);
              });
            break;
          }
          default: {
            context.log(`Error: invalid animation queue type ${entry.type}, skipping animation`);
            finalize(processMessage);
          }
        }
      });
    }
    processMessage();
  });
};

export default prcoessQueueTrigger;

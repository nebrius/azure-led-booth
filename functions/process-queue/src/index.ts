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
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { createQueueService, createTableService, TableUtilities } from 'azure-storage';
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
const AZURE_STORAGE_STATUS_TABLE_NAME = getEnvironmentVariable('AZURE_STORAGE_STATUS_TABLE_NAME');
const AZURE_STORAGE_STATUS_ROW_NAME = getEnvironmentVariable('AZURE_STORAGE_STATUS_ROW_NAME');
const AZURE_STORAGE_CONNECTION_STRING = getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');
const API_KEY = getEnvironmentVariable('API_KEY');

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
    headers: {
      'Content-Type': 'application/json',
    },
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

const prcoessQueueTrigger: AzureFunction = (context: Context, req: HttpRequest): void => {
  const queueService = createQueueService(AZURE_STORAGE_CONNECTION_STRING);
  if (!req.body || req.body.apiKey !== API_KEY) {
    context.log('[ProcessQueueTrigger]: Invalid API key, not processing');
    context.res = {
      status: 400,
      body: 'Not authorized'
    };
    return;
  }
  const isTimerBased: boolean = req.body.isTimerBased;
  context.log('[ProcessQueueTrigger]: Fetching or creating queue');
  queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (createErr, createResult, createResponse) => {
    if (createErr) {
      context.log(`[ProcessQueueTrigger]: Could not get queue, bailing: ${createErr}`);
      context.done();
      return;
    }

    const tableService = createTableService();
    tableService.createTableIfNotExists(AZURE_STORAGE_STATUS_TABLE_NAME, (createTableErr) => {
      if (createTableErr) {
        context.log(`[ProcessQueueTrigger]: Could not get queue, bailing: ${createTableErr}`);
        context.done();
        return;
      }

      function setCurrentAnimationStatus(isUserdriven: boolean, cb: () => void): void {
        const entity = {
          PartitionKey: TableUtilities.entityGenerator.String(AZURE_STORAGE_STATUS_TABLE_NAME),
          RowKey: TableUtilities.entityGenerator.String(AZURE_STORAGE_STATUS_ROW_NAME),
          isUserdriven: TableUtilities.entityGenerator.Boolean(isUserdriven),
        };
        context.log('Updating the animation state');
        tableService.insertOrReplaceEntity(AZURE_STORAGE_STATUS_TABLE_NAME, entity, (updateAnimationErr) => {
          if (updateAnimationErr) {
            context.log(`Could not update the animation state: ${updateAnimationErr}`);
          } else {
            context.log('Updated the animation state');
          }
        });
      }

      // Check if this request came from a timer-based mechanism, such as the device requesting a new animation, which
      // means we should always get the next message, or if it's something we should only run if the queue is empty
      if (!isTimerBased) {
        context.log('Getting the current animation type');
        tableService.retrieveEntity(
          AZURE_STORAGE_STATUS_TABLE_NAME,
          AZURE_STORAGE_STATUS_TABLE_NAME,
          AZURE_STORAGE_STATUS_ROW_NAME,
          (retrieveError, result, response) => {

          if (retrieveError || !result) {
            context.log(`Could not retrieve entity: ${retrieveError}`);
            context.done();
            return;
          }
          if (!(result as any).isUserdriven._) {
            processMessage();
          }
        });
      } else {
        processMessage();
      }

      function processMessage(): void {
        context.log('[ProcessQueueTrigger]: Getting the next message from the queue');
        // Dequeue the message from the queue, but leave it there. We'll delete it later once we're done processing it.
        // This approach allows us to leave it in the queue but mark it so no one else can process it.
        queueService.getMessage(AZURE_STORAGE_QUEUE_NAME, (getErr, message) => {
          // This means there was an error getting the messages, and we should report it as an error
          if (getErr) {
            context.log(`[ProcessQueueTrigger]: Could not get message, bailing: ${getErr}`);
            context.done();
            return;
          }

          // This means there are no messages to get, so let's show the default animation
          if (!message) {
            context.log('[ProcessQueueTrigger]: No messages in queue, running default animation');
            processDefaultAnimation()
              .then(() => new Promise((resolve) => {
                setCurrentAnimationStatus(false, resolve);
              }))
              .then(() => {
                context.log('[ProcessQueueTrigger]: Default animation sent to the device');
                context.done();
              })
              .catch((err: Error) => {
                context.log(
                  `[ProcessQueueTrigger]: Could not process default animation, skipping animation: ${err.message}`);
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
                context.log(`[ProcessQueueTrigger]: Could not delete message, bailing: ${err}`);
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
            context.log(`[ProcessQueueTrigger]: Error: could not parse message, skipping animation: ${e}`);
            finalize(processMessage);
            return;
          }
          switch (entry.type) {
            case QueueType.Basic: {
              context.log('[ProcessQueueTrigger]: Processing basic animation');
              processBasicAnimation(entry as IBasicQueueEntry)
                .then(() => new Promise((resolve) => {
                  setCurrentAnimationStatus(true, resolve);
                }))
                .then(() => {
                  context.log('[ProcessQueueTrigger]: Basic animation sent to the device');
                  finalize(() => context.done());
                })
                .catch((err: Error) => {
                  context.log(
                    `[ProcessQueueTrigger]: Could not process basic animation, skipping animation: ${err.message}`);
                  finalize(processMessage);
                });
              break;
            }
            case QueueType.Custom: {
              context.log('[ProcessQueueTrigger]: Processing custom animation');
              processCustomAnimation(entry as ICustomQueueEntry)
                .then(() => new Promise((resolve) => {
                  setCurrentAnimationStatus(true, resolve);
                }))
                .then(() => {
                  context.log('[ProcessQueueTrigger]: Custom animation sent to the device');
                  finalize(() => context.done());
                })
                .catch((err: Error) => {
                  context.log(
                    `[ProcessQueueTrigger]: Could not process custom animation, skipping animation: ${err.message}`);
                  finalize(processMessage);
                });
              break;
            }
            default: {
              context.log(
                `[ProcessQueueTrigger]: Error: invalid animation queue type ${entry.type}, skipping animation`);
              finalize(processMessage);
            }
          }
        });
      }
    });
  });
};

export default prcoessQueueTrigger;

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

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { createQueueService } from 'azure-storage';
import { getEnvironmentVariable, IBasicQueueEntry, ICustomQueueEntry } from './common/common';
import { sendResponse } from './util/util';

const AZURE_STORAGE_QUEUE_NAME = getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_CONNECTION_STRING = getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');

const getQueueTrigger: AzureFunction = (context: Context, req: HttpRequest): void => {
  context.log('[GetQueueTrigger]: Processing request');

  context.log('[GetQueueTrigger]: Fetching or creating queue');
  const queueService = createQueueService(AZURE_STORAGE_CONNECTION_STRING);
  queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (createErr, createResult, createResponse) => {
    if (createErr) {
      sendResponse(500, { error: 'Could not get queue' }, context);
      return;
    }
    context.log('[GetQueueTrigger]: Peaking queue');
    queueService.peekMessages(AZURE_STORAGE_QUEUE_NAME, {
      numOfMessages: 32,
    }, (peekErr, peekResult, peekResponse) => {
      if (peekErr) {
        sendResponse(500, { error: 'Could not peek messages in queue' }, context);
        return;
      }
      const animations: Array<ICustomQueueEntry | IBasicQueueEntry> = [];
      for (const message of peekResult) {
        if (!message.messageText) {
          sendResponse(500, { error: `Message with ID ${message.messageId} did not have a message body` }, context);
          return;
        }
        animations.push(JSON.parse(message.messageText));
      }
      sendResponse(200, animations, context);
    });
  });
};

export default getQueueTrigger;

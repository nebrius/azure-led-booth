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
import { getEnvironmentVariable } from './common/common';

const AZURE_STORAGE_QUEUE_NAME = getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_ACCOUNT = getEnvironmentVariable('AZURE_STORAGE_ACCOUNT');
const AZURE_STORAGE_ACCESS_KEY = getEnvironmentVariable('AZURE_STORAGE_ACCESS_KEY');
const AZURE_STORAGE_CONNECTION_STRING = getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');

const getQueueTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  context.log('HTTP trigger function processed a request.');
  // const name = (req.query.name || (req.body && req.body.name));

  const queueService = createQueueService(
    AZURE_STORAGE_ACCOUNT,
    AZURE_STORAGE_ACCESS_KEY,
    AZURE_STORAGE_CONNECTION_STRING);
  queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (err, result, response) => {
    context.log(err, result, response);
    if (err) {
      context.res = {
        status: 500,
        body: 'Could not get queue'
      };
      return
    }
    queueService.peekMessages(AZURE_STORAGE_QUEUE_NAME, { numOfMessages: 10000 }, (err, result, response) => {
      context.log(err, result, response);
      if (err) {
        context.res = {
          status: 500,
          body: 'Could not get messages in queue'
        };
        return;
      }
      context.res = {
        body: JSON.stringify(result)
      };
    });
  });
};

export default getQueueTrigger;

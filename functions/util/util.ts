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

import { Context } from '@azure/functions';
import { createTableService, TableUtilities } from 'azure-storage';
import { getEnvironmentVariable, StatType } from '../common/common';
import { v4 } from 'uuid';
import { curry } from 'conditional-reduce';
import fetch from 'node-fetch';

const PROCESS_QUEUE_ENDPOINT = getEnvironmentVariable('PROCESS_QUEUE_ENDPOINT');
const AZURE_STORAGE_TABLE_NAME = getEnvironmentVariable('AZURE_STORAGE_TABLE_NAME');

interface IBody {
  [ key: string]: any;
}

const logPrefixReducer = curry({
  [StatType.Basic]: () => 'BasicTrigger',
  [StatType.Custom]: () => 'CustomTrigger',
  [StatType.Simulation]: () => 'SimulationTrigger',
}, () => 'GetQueueTrigger');

export async function pokeQueue(apiKey: string, isTimerBased: boolean) {
  await fetch(PROCESS_QUEUE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, isTimerBased })
  });
}

export async function sendResponse(status: number, body: IBody, context: Context, statType?: StatType) {
  const logPrefix = logPrefixReducer(statType || '');
  context.log(`[${logPrefix}]: Sending ${status} response for ${statType ? `${statType} submission` : 'get-queue'}`);
  context.res = { status, body };
  if (statType) {
    await new Promise((resolve, reject) => {
      context.log(`[${logPrefix}]: Fetching or creating the stats table`);
      const tableService = createTableService();
      tableService.createTableIfNotExists(AZURE_STORAGE_TABLE_NAME, (createErr) => {
        if (createErr) {
          context.log(`[${logPrefix}]: Could not get stats table: ${createErr}`);
          context.done();
          reject();
          return;
        }
        const entity = {
          PartitionKey: TableUtilities.entityGenerator.String(AZURE_STORAGE_TABLE_NAME),
          RowKey: TableUtilities.entityGenerator.String(v4()),
          type: TableUtilities.entityGenerator.String(statType),
          statusCode: TableUtilities.entityGenerator.Int32(status)
        };
        context.log(`[${logPrefix}]: Saving anonymized stat entity to stats table with row key ${entity.RowKey}`);
        tableService.insertEntity(AZURE_STORAGE_TABLE_NAME, entity, (insertErr) => {
          if (insertErr) {
            context.log(`[${logPrefix}]: Could not insert stats entity: ${insertErr}`);
          } else {
            context.log(`[${logPrefix}]: Stat entity saved`);
          }
          context.done();
          resolve();
        });
      });
    });
  } else {
    context.done();
  }
}

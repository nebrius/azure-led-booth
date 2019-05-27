"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const azure_storage_1 = require("azure-storage");
const common_1 = require("../common/common");
const uuid_1 = require("uuid");
const conditional_reduce_1 = require("conditional-reduce");
const AZURE_STORAGE_TABLE_NAME = common_1.getEnvironmentVariable('AZURE_STORAGE_TABLE_NAME');
const logPrefixReducer = conditional_reduce_1.curry({
    [common_1.StatType.Basic]: () => 'BasicTrigger',
    [common_1.StatType.Custom]: () => 'CustomTrigger',
    [common_1.StatType.Simulation]: () => 'SimulationTrigger',
}, () => 'GetQueueTrigger');
async function sendResponse(status, body, context, statType) {
    const logPrefix = logPrefixReducer(statType || '');
    context.log(`[${logPrefix}]: Sending ${status} response for ${statType ? `${statType} submission` : 'get-queue'}`);
    context.res = { status, body };
    if (statType) {
        await new Promise((resolve, reject) => {
            context.log(`[${logPrefix}]: Fetching or creating the stats table`);
            const tableService = azure_storage_1.createTableService();
            tableService.createTableIfNotExists(AZURE_STORAGE_TABLE_NAME, (createErr) => {
                if (createErr) {
                    context.log(`[${logPrefix}]: Could not get stats table: ${createErr}`);
                    context.done();
                    reject();
                    return;
                }
                const entity = {
                    PartitionKey: azure_storage_1.TableUtilities.entityGenerator.String(AZURE_STORAGE_TABLE_NAME),
                    RowKey: azure_storage_1.TableUtilities.entityGenerator.String(uuid_1.v4()),
                    type: azure_storage_1.TableUtilities.entityGenerator.String(statType),
                    statusCode: azure_storage_1.TableUtilities.entityGenerator.Int32(status)
                };
                context.log(`[${logPrefix}]: Saving anonymized stat entity to stats table with row key ${entity.RowKey}`);
                tableService.insertEntity(AZURE_STORAGE_TABLE_NAME, entity, (insertErr) => {
                    if (insertErr) {
                        context.log(`[${logPrefix}]: Could not insert stats entity: ${insertErr}`);
                    }
                    else {
                        context.log(`[${logPrefix}]: Stat entity saved`);
                    }
                    context.done();
                    resolve();
                });
            });
        });
    }
    else {
        context.done();
    }
}
exports.sendResponse = sendResponse;
//# sourceMappingURL=util.js.map
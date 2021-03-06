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
const revalidator_1 = require("revalidator");
const common_1 = require("./common/common");
const util_1 = require("./util/util");
const AZURE_STORAGE_QUEUE_NAME = common_1.getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_CONNECTION_STRING = common_1.getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');
const API_KEY = common_1.getEnvironmentVariable('API_KEY');
const submitBasicTrigger = (context, req) => {
    context.log('[BasicTrigger]: Processing submission');
    const message = req.body;
    if (!revalidator_1.validate(message, common_1.basicSubmissionSchema).valid) {
        util_1.sendResponse(400, { error: 'Invalid submission' }, context, common_1.StatType.Basic);
        return;
    }
    context.log('[BasicTrigger]: Fetching or creating queue');
    const queueService = azure_storage_1.createQueueService(AZURE_STORAGE_CONNECTION_STRING);
    queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, async (createErr, createResult, createResponse) => {
        if (createErr) {
            util_1.sendResponse(500, { error: 'Could not get queue' }, context, common_1.StatType.Basic);
            return;
        }
        const entry = {
            type: common_1.QueueType.Basic,
            submission: message
        };
        context.log('[BasicTrigger]: Adding queue entry');
        queueService.createMessage(AZURE_STORAGE_QUEUE_NAME, JSON.stringify(entry), async (addErr) => {
            if (addErr) {
                util_1.sendResponse(500, { error: 'Could not add message to queue' }, context, common_1.StatType.Basic);
                return;
            }
            util_1.pokeQueue(API_KEY, false);
            util_1.sendResponse(200, { status: 'ok' }, context, common_1.StatType.Basic);
        });
    });
};
exports.default = submitBasicTrigger;
//# sourceMappingURL=index.js.map
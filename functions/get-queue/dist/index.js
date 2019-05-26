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
const common_1 = require("./common/common");
const util_1 = require("./util/util");
const AZURE_STORAGE_QUEUE_NAME = common_1.getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_CONNECTION_STRING = common_1.getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');
const getQueueTrigger = (context, req) => {
    const queueService = azure_storage_1.createQueueService(AZURE_STORAGE_CONNECTION_STRING);
    queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (createErr, createResult, createResponse) => {
        if (createErr) {
            util_1.sendResponse(500, { error: 'Could not get queue' }, context);
            return;
        }
        queueService.peekMessages(AZURE_STORAGE_QUEUE_NAME, {
            numOfMessages: 32,
        }, (peekErr, peekResult, peekResponse) => {
            if (peekErr) {
                util_1.sendResponse(500, { error: 'Could not peek messages in queue' }, context);
                return;
            }
            const animations = [];
            for (const message of peekResult) {
                if (!message.messageText) {
                    util_1.sendResponse(500, { error: `Message with ID ${message.messageId} did not have a message body` }, context);
                    return;
                }
                animations.push(JSON.parse(message.messageText));
            }
            util_1.sendResponse(200, animations, context);
        });
    });
};
exports.default = getQueueTrigger;
//# sourceMappingURL=index.js.map
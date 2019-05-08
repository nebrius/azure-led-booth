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
const util_1 = require("util");
const AZURE_STORAGE_QUEUE_NAME = common_1.getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_ACCOUNT = common_1.getEnvironmentVariable('AZURE_STORAGE_ACCOUNT');
const AZURE_STORAGE_ACCESS_KEY = common_1.getEnvironmentVariable('AZURE_STORAGE_ACCESS_KEY');
const AZURE_STORAGE_CONNECTION_STRING = common_1.getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');
const getQueueTrigger = async (context, req) => {
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const queueService = azure_storage_1.createQueueService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY, AZURE_STORAGE_CONNECTION_STRING);
    const result = await util_1.promisify(queueService.createQueueIfNotExists)(AZURE_STORAGE_QUEUE_NAME);
    console.log(result);
    if (name) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: `Hello ${(req.query.name || req.body.name)}`
        };
    }
    else {
        context.res = {
            status: 400,
            body: 'Please pass a name on the query string or in the request body'
        };
    }
};
exports.default = getQueueTrigger;
//# sourceMappingURL=index.js.map
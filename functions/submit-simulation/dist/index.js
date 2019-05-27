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
const util_1 = require("./util/util");
const revalidator_1 = require("revalidator");
const common_1 = require("./common/common");
const node_fetch_1 = require("node-fetch");
const submitSimulationTrigger = async (context, req) => {
    const message = req.body;
    if (!revalidator_1.validate(message, common_1.simulationSubmissionSchema).valid) {
        util_1.sendResponse(400, { error: 'Invalid submission' }, context, common_1.StatType.Simulation);
        return;
    }
    let response;
    try {
        response = await node_fetch_1.default(message.functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey: message.apiKey
            })
        });
    }
    catch (e) {
        util_1.sendResponse(400, { error: `Could not call your Function: ${e}` }, context, common_1.StatType.Simulation);
        return;
    }
    if (response.status !== 200) {
        const responseText = await response.text();
        util_1.sendResponse(400, { error: `Your Function returned a ${response.status} status code with response text "${responseText}"` }, context, common_1.StatType.Simulation);
        return;
    }
    let responseMessage;
    try {
        responseMessage = await response.json();
    }
    catch (e) {
        util_1.sendResponse(500, { error: `Could not parse response: ${e}` }, context, common_1.StatType.Simulation);
        return;
    }
    if (!revalidator_1.validate(responseMessage, common_1.customSubmissionResponseSchema).valid) {
        util_1.sendResponse(400, { error: `Received invalid response from user Function: ${JSON.stringify(message, null, '  ')}` }, context, common_1.StatType.Simulation);
        return;
    }
    util_1.sendResponse(200, responseMessage.waveParameters, context, common_1.StatType.Simulation);
};
exports.default = submitSimulationTrigger;
//# sourceMappingURL=index.js.map
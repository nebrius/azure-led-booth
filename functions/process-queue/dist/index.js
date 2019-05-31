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
const azure_iothub_1 = require("azure-iothub");
const azure_storage_1 = require("azure-storage");
const revalidator_1 = require("revalidator");
const common_1 = require("./common/common");
const rvl_node_animations_1 = require("rvl-node-animations");
const color_convert_1 = require("color-convert");
const node_fetch_1 = require("node-fetch");
const IOT_HUB_CONNECTION_STRING = common_1.getEnvironmentVariable('IOT_HUB_CONNECTION_STRING');
const IOT_HUB_DEVICE_ID = common_1.getEnvironmentVariable('IOT_HUB_DEVICE_ID');
const AZURE_STORAGE_QUEUE_NAME = common_1.getEnvironmentVariable('AZURE_STORAGE_QUEUE_NAME');
const AZURE_STORAGE_CONNECTION_STRING = common_1.getEnvironmentVariable('AZURE_STORAGE_CONNECTION_STRING');
const API_KEY = common_1.getEnvironmentVariable('API_KEY');
async function sendAnimation(animation) {
    return new Promise((resolve, reject) => {
        const client = azure_iothub_1.Client.fromConnectionString(IOT_HUB_CONNECTION_STRING);
        client.open((openErr) => {
            if (openErr) {
                reject(openErr);
                return;
            }
            client.send(IOT_HUB_DEVICE_ID, JSON.stringify(animation), (sendErr) => {
                if (sendErr) {
                    reject(sendErr);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
const COLOR_REGEX = /^\#([0-9a-zA-Z][0-9a-zA-Z])([0-9a-zA-Z][0-9a-zA-Z])([0-9a-zA-Z][0-9a-zA-Z])$/;
function parseColor(str) {
    const color = COLOR_REGEX.exec(str);
    if (!color) {
        return undefined;
    }
    const [, r, g, b] = color;
    const [h, s, v] = color_convert_1.rgb.hsv([parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)]);
    return {
        h: Math.round(255 * h / 360),
        s: Math.round(255 * s / 100),
        v: Math.round(255 * v / 100)
    };
}
async function processBasicAnimation(entry) {
    const foregroundColor = parseColor(entry.submission.foregroundColor);
    if (!foregroundColor) {
        throw new Error(`Invalid foreground color ${foregroundColor}`);
    }
    const backgroundColor = parseColor(entry.submission.backgroundColor);
    if (!backgroundColor) {
        throw new Error(`Invalid background color ${backgroundColor}`);
    }
    const rate = entry.submission.rate;
    const animation = rvl_node_animations_1.createWaveParameters(
    // Create the moving wave on top
    rvl_node_animations_1.createMovingWave(foregroundColor.h, foregroundColor.s, rate, 2), 
    // Create the solid color on bottom
    rvl_node_animations_1.createSolidColorWave(backgroundColor.h, backgroundColor.s, backgroundColor.v, 255));
    await sendAnimation(animation);
}
async function processCustomAnimation(entry) {
    const response = await node_fetch_1.default(entry.submission.functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            apiKey: entry.submission.apiKey
        })
    });
    const message = await response.json();
    if (!revalidator_1.validate(message, common_1.customSubmissionResponseSchema).valid) {
        throw new Error(`Received invalid response from user Function, skipping: ${JSON.stringify(message, null, '  ')}`);
    }
    await sendAnimation(message.waveParameters);
}
async function processDefaultAnimation() {
    const animation = rvl_node_animations_1.createWaveParameters(
    // Create the moving wave on top
    rvl_node_animations_1.createMovingWave(215, 255, 8, 2), 
    // Creating a pulsing green on top of the blue, but below the purple
    rvl_node_animations_1.createPulsingWave(85, 255, 2), 
    // Create the solid blue on bottom
    rvl_node_animations_1.createSolidColorWave(170, 255, 255, 255));
    await sendAnimation(animation);
}
const prcoessQueueTrigger = (context, req) => {
    const queueService = azure_storage_1.createQueueService(AZURE_STORAGE_CONNECTION_STRING);
    if (!req.body || req.body.apiKey !== API_KEY) {
        context.log('[ProcessQueueTrigger]: Invalid API key, not processing');
        context.res = {
            status: 400,
            body: 'Not authorized'
        };
        return;
    }
    const isTimerBased = req.body.isTimerBased;
    context.log('[ProcessQueueTrigger]: Fetching or creating queue');
    queueService.createQueueIfNotExists(AZURE_STORAGE_QUEUE_NAME, (createErr, createResult, createResponse) => {
        if (createErr) {
            context.log(`[ProcessQueueTrigger]: Could not get queue, bailing: ${createErr}`);
            context.done();
            return;
        }
        // Check if this request came from a timer-based mechanism, such as the device requesting a new animation,
        // which means we should always get the next message, or if it's something we should only run if the queue is empty
        if (!isTimerBased) {
            context.log('Peeking messages to see if we\'re running the default animation');
            queueService.peekMessages(AZURE_STORAGE_QUEUE_NAME, {
                numOfMessages: 32,
            }, (peekErr, peekResult, peekResponse) => {
                if (peekErr) {
                    context.log('Could not peek messages in queue');
                    context.done();
                    return;
                }
                if (!peekResult.length) {
                    processMessage();
                }
                else {
                    context.log('Not updating animation because one is already playing');
                    context.done();
                }
            });
        }
        else {
            processMessage();
        }
        function processMessage() {
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
                        .then(() => {
                        context.log('[ProcessQueueTrigger]: Default animation sent to the device');
                        context.done();
                    })
                        .catch((err) => {
                        context.log(`[ProcessQueueTrigger]: Could not process default animation, skipping animation: ${err.message}`);
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
                function finalize(cb) {
                    // Now that we're done processing, let's remove it from the queue
                    queueService.deleteMessage(AZURE_STORAGE_QUEUE_NAME, messageId, popReceipt, (err) => {
                        if (err) {
                            context.log(`[ProcessQueueTrigger]: Could not delete message, bailing: ${err}`);
                            context.done();
                            return;
                        }
                        cb();
                    });
                }
                let entry;
                try {
                    entry = JSON.parse(messageText);
                }
                catch (e) {
                    context.log(`[ProcessQueueTrigger]: Error: could not parse message, skipping animation: ${e}`);
                    finalize(processMessage);
                    return;
                }
                switch (entry.type) {
                    case common_1.QueueType.Basic: {
                        context.log('[ProcessQueueTrigger]: Processing basic animation');
                        processBasicAnimation(entry)
                            .then(() => {
                            context.log('[ProcessQueueTrigger]: Basic animation sent to the device');
                            finalize(() => context.done());
                        })
                            .catch((err) => {
                            context.log(`[ProcessQueueTrigger]: Could not process basic animation, skipping animation: ${err.message}`);
                            finalize(processMessage);
                        });
                        break;
                    }
                    case common_1.QueueType.Custom: {
                        context.log('[ProcessQueueTrigger]: Processing custom animation');
                        processCustomAnimation(entry)
                            .then(() => {
                            context.log('[ProcessQueueTrigger]: Custom animation sent to the device');
                            finalize(() => context.done());
                        })
                            .catch((err) => {
                            context.log(`[ProcessQueueTrigger]: Could not process custom animation, skipping animation: ${err.message}`);
                            finalize(processMessage);
                        });
                        break;
                    }
                    default: {
                        context.log(`[ProcessQueueTrigger]: Error: invalid animation queue type ${entry.type}, skipping animation`);
                        finalize(processMessage);
                    }
                }
            });
        }
    });
};
exports.default = prcoessQueueTrigger;
//# sourceMappingURL=index.js.map
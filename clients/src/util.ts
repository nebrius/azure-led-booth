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

import { IBasicQueueEntry, ICustomQueueEntry } from './common/common';

const QUEUE_UPDATE_RATE = 10 * 1000;

// This variable is injected by WebPack, but TypeScript doesn't know that, so we declare the variable here
declare var API_ENDPOINT: string;

export async function api(endpoint: string, method: 'GET' | 'POST', body?: { [ key: string ]: string }) {
  const options: RequestInit = { method };
  if (method === 'POST' && body) {
    options.headers = {
      'Content-Type': 'application/json'
    };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(API_ENDPOINT + endpoint, options);
  return await response.json();
}

let queue: Array<IBasicQueueEntry | ICustomQueueEntry> = [];
let updateTimeout: number = 0;
let queueUpdatedListener: () => void | undefined;

export function onQueueUpdated(cb: () => void): void {
  queueUpdatedListener = cb;
}

export async function updateQueue() {
  clearTimeout(updateTimeout);
  queue = await api('get-queue', 'GET');
  if (queueUpdatedListener) {
    queueUpdatedListener();
  }
  updateTimeout = window.setTimeout(updateQueue, QUEUE_UPDATE_RATE);
}

export function getCurrentQueue() {
  return queue;
}

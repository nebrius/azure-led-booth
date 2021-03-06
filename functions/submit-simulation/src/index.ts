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
import { sendResponse } from './util/util';
import { validate } from 'revalidator';
import {
  ISimulationSubmission,
  simulationSubmissionSchema,
  ICustomSubmissionResponse,
  customSubmissionResponseSchema,
  StatType
} from './common/common';
import fetch, { Response } from 'node-fetch';

const submitSimulationTrigger: AzureFunction = async (context: Context, req: HttpRequest) => {
  context.log('[SimulationTrigger]: Processing submission');

  const message: ISimulationSubmission = req.body;
  if (!validate(message, simulationSubmissionSchema).valid) {
    await sendResponse(400, { error: 'Invalid submission' }, context, StatType.Simulation);
    return;
  }

  context.log('[SimulationTrigger]: Calling user Function');
  let response: Response;
  try {
    response = await fetch(message.functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: message.apiKey
      })
    });
  } catch (e) {
    await sendResponse(
      400,
      { error: `Could not call your Function: ${e}` },
      context,
      StatType.Simulation);
    return;
  }

  if (response.status !== 200) {
    const responseText = await response.text();
    await sendResponse(
      400,
      { error: `Your Function returned a ${response.status} status code with response text "${responseText}"` },
      context,
      StatType.Simulation);
    return;
  }

  context.log('[SimulationTrigger]: Processing respones from user Function');
  let responseMessage: ICustomSubmissionResponse;
  try {
    responseMessage = await response.json();
  } catch (e) {
    await sendResponse(500, { error: `Could not parse response: ${e}` }, context, StatType.Simulation);
    return;
  }
  if (!validate(responseMessage, customSubmissionResponseSchema).valid) {
    await sendResponse(
      400,
      { error: `Received invalid response from user Function: ${JSON.stringify(message, null, '  ')}` },
      context,
      StatType.Simulation);
    return;
  }

  await sendResponse(200, responseMessage.waveParameters, context, StatType.Simulation);
};

export default submitSimulationTrigger;

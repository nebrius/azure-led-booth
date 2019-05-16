import { IWaveParameters } from 'rvl-node-types';
export interface ICustomSubmission {
    displayName: string;
    authToken: string;
    functionUrl: string;
}
export interface ICustomSubmissionResponse {
    waveParameters: IWaveParameters;
}
export declare const customSubmissionSchema: any;
export declare const customSubmissionResponseSchema: any;

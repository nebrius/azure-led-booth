import { IBasicSubmission } from './IBasicSubmission';
import { ICustomSubmission } from './ICustomSubmission';
export declare enum QueueType {
    Custom = 0,
    Basic = 1
}
export interface IQueueEntry {
    type: QueueType;
}
export interface IBasicQueueEntry extends IQueueEntry {
    type: QueueType.Basic;
    submission: IBasicSubmission;
}
export interface ICustomQueueEntry extends IQueueEntry {
    type: QueueType.Custom;
    userId: string;
    submission: ICustomSubmission;
}

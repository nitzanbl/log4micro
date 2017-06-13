import {Session} from './session';

export class ProjectInfo {
    public id: number;
    public name: String;
    public description: String;
    public level_control: String;
    public status: String;
    public sessions: Session[];
}

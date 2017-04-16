export class MonitoringMessage {
    public id: number;
    public project_id: number;
    public log_level: string;
    public log_message: string;
    public tags: string;
    public time: string;
    public function_name: string;
    public file_name: string;
    public line: number;
    public type: number;
}

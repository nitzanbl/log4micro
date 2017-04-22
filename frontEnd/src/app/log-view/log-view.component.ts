import { Component, OnInit } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {ActivatedRoute} from '@angular/router';
import {MonitoringMessage} from '../monitoring-message';


@Component({
  selector: 'app-log-view',
  templateUrl: './log-view.component.html',
  styleUrls: ['./log-view.component.css']
})
export class LogViewComponent implements OnInit {
  project: Project = null;
  monitoringMessages: MonitoringMessage[]  = [];
  constructor(private rout: ActivatedRoute, private projectService: ProjectService) { }

  ngOnInit() {
    this.rout.params.subscribe((params)=>{
      this.projectService.getProjectById(+params['id']).then((proj)=>{
        this.project = proj;
      })
      this.projectService.getLogsByProjectId(+params['id']).then((logs)=>{
        this.monitoringMessages = logs;
      })
    })
  }

  getTimeStamp(msg): string {
    console.log(this);
    if (msg.time == null) {
        return '';
    }
    return msg.time.substr(0, msg.time.indexOf('.'));
  }
  getLogLevel(msg): string {
      return msg.log_level;
  }
  getFunctionName(msg): string {
      return msg.function_name + '()';
  }
  getLineNumber(msg): string {
      return '' + msg.line;
  }
  getMessage(msg): string {
      return msg.log_message;
  }
}

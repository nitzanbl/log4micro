import { Component, OnInit, ViewChild } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {ActivatedRoute} from '@angular/router';
import {MonitoringMessage} from '../monitoring-message';
import {StreamService} from '../stream.service'


@Component({
  selector: 'app-log-view',
  templateUrl: './log-view.component.html',
  styleUrls: ['./log-view.component.css']
})
export class LogViewComponent implements OnInit {
  project: Project = null;
  monitoringMessages: MonitoringMessage[]  = [];
  connection;
  constructor(private rout: ActivatedRoute, private projectService: ProjectService, private streamService: StreamService) { }
  @ViewChild('logs') logs; 
  ngOnInit() {
    this.rout.params.subscribe((params)=>{
      this.projectService.getProjectById(+params['id']).then((proj)=>{
        this.project = proj;
      })
      this.connection = this.streamService.getMessages().subscribe((message: any) => {
      var mMessage: MonitoringMessage = new MonitoringMessage();
      var tempDate: Date;
      mMessage.project_id = message.project_id;
      mMessage.log_level = message.log_level;
      mMessage.log_message = message.log_message;
      tempDate = new Date(message.time * 1000);
      var month = ('0' + tempDate.getMonth().toString()).substr(-2);
      var day = ('0' + tempDate.getDay().toString()).substr(-2);
      var hours = ('0' + tempDate.getHours().toString()).substr(-2);
      var minutes = ('0' + tempDate.getMinutes().toString()).substr(-2);
      var seconds = ('0' + tempDate.getSeconds().toString()).substr(-2);
      mMessage.time = tempDate.getFullYear().toString() + '-' + month + '-' +
      day + ' ' + hours + ':' + minutes + ':' + seconds;
      mMessage.function_name = message.function_name;
      mMessage.file_name = message.file_name;
      mMessage.line = message.line;
      mMessage.type = message.type;

      this.monitoringMessages.push(mMessage);
      this.logs.nativeElement.scrollTop = this.logs.nativeElement.scrollHeight
      })
      this.projectService.getLogsByProjectId(+params['id']).then((logs)=>{
        this.monitoringMessages = logs;
        // this.logs.nativeElement.scrollTop = this.logs.nativeElement.scrollHeight
      })
    })
  }

  getTimeStamp(msg): string {
    if (msg.time == null) {
        return '';
    }
    return msg.time.split('.')[0];
    //msg.time.substr(0, msg.time.indexOf('.'));
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

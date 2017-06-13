import { Component, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {Session} from '../session';
import {ActivatedRoute} from '@angular/router';
import {MonitoringMessage} from '../monitoring-message';
import {StreamService} from '../stream.service'
import { DatePickerOptions, DateModel } from 'ng2-datepicker';


@Component({
  selector: 'app-log-view',
  templateUrl: './log-view.component.html',
  styleUrls: ['./log-view.component.css']
})
export class LogViewComponent implements OnInit, AfterViewChecked  {
  project: Project = null;
  session: Session = null;
  monitoringMessages: MonitoringMessage[]  = [];
  connection;
  liveScroll = true;
  currentTab = 0;
  filterTime: DateModel;
  option: DatePickerOptions; 
  
  filteredLevels= ['INFO','ERROR','DEBUG',"TRACE"];
 
  constructor(private rout: ActivatedRoute, private projectService: ProjectService, private streamService: StreamService) { }
 
  @ViewChild('logs') logs; 
  @ViewChild('cal') calendar;

  ngOnInit() {
    this.option = new DatePickerOptions();
    this.option.initialDate = new Date();
    this.option.firstWeekdaySunday = true;
    this.option.autoApply = true;
    this.rout.params.subscribe((params)=>{
      this.projectService.getProjectById(+params['id']).then((proj)=>{
        this.project = proj;
      })
      this.projectService.getSessionById(+params['id'],+params['session_id']).then((sess)=>{
        this.session = sess;
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
      })
      this.projectService.getLogsByProjectId(+params['id']).then((logs)=>{
        this.monitoringMessages = logs;
        // this.logs.nativeElement.scrollTop = this.logs.nativeElement.scrollHeight
      })
    })
  }

  ngAfterViewChecked() {
    if (typeof this.logs != "undefined") {
      if (this.liveScroll) {
        this.logs.nativeElement.scrollTop = this.logs.nativeElement.scrollHeight - this.logs.nativeElement.clientHeight;
      }
    }
    if (typeof this.calendar != "undefined") {
      
     
    }
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

  onScroll(e) {
    var top = e.target.scrollTop;
    var height = e.target.scrollHeight;
    var vHeight = e.target.clientHeight;
    if (vHeight + top == height) {
      this.liveScroll = true;
    } else {
      this.liveScroll = false;
    }
  }
  getLog(monitoringMessages) {
    return monitoringMessages.filter((mm)=> {
      return this.filteredLevels.indexOf(mm.log_level)>=0;
    });
  }

}

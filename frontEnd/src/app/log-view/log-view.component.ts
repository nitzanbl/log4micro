import { Component, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/core'; 
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {Session} from '../session';
import {MmData} from '../mm-data';
import {ActivatedRoute} from '@angular/router';
import {MonitoringMessage} from '../monitoring-message';
import {StreamService} from '../stream.service'
import { DatePickerOptions, DateModel } from 'ng2-datepicker';
import { Daterangepicker } from 'ng2-daterangepicker';


@Component({
  selector: 'app-log-view',
  templateUrl: './log-view.component.html',
  styleUrls: ['./log-view.component.css'],
  animations: [
    trigger('slideIn', [
    state('*', style({ 'overflow-y': 'hidden' })),
    state('void', style({ 'overflow-y': 'hidden' })),
    transition(':leave', [
        style({ height: '*' }),
        animate(300, style({ height: 0 }))
    ]),
    transition(':enter', [
        style({ height: '0' }),
        animate(300, style({ height: '*' }))
])])
  ]
})
export class LogViewComponent implements OnInit, AfterViewChecked  {
  project: Project = null;
  public daterange: any = {};
  public fromDate: number = 0;
  public toDate: number = 0;
  public selectedMM: any = null;
  public logData: MmData[] = [];

  public options: any = {
      locale: { format: 'YYYY-MM-DD' },
      alwaysShowCalendars: false
  };
  session: Session = null;
  query = "";
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
        if (message.project_id == this.project.id && message.session_id == this.session.id) {
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
        }
      })
      this.projectService.getLogsByProjectIdSessionId(+params['id'], +params['session_id']).then((logs)=>{
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

  selectedDate(e) {
    this.fromDate = e.picker.startDate.unix();
    this.toDate = e.picker.endDate.unix();
    console.log(this.fromDate + " - " + this.toDate);
    this.projectService.getLogsByProjectIdSessionIdAndQuery(this.project.id, this.session.id, this.query, this.fromDate, this.toDate).then((logs)=>{
      this.monitoringMessages = logs;
    })
  }

  clickedMM(mm) {
    this.logData = [];
    if (this.selectedMM == mm) {
      this.selectedMM = null;
    } else {
      this.selectedMM = mm;
    }
    this.projectService.getDataForLog(this.project.id, mm.id).then((data)=>{
      var arr = [];
      for (var i = 0; i < data.length; i+=1) {
        arr.push(new MmData(data[i]));
      }
      this.logData = arr;
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
  querySearch() {
    if (this.query == "") {
      this.projectService.getLogsByProjectIdSessionId(this.project.id, this.session.id).then((logs)=>{
        this.monitoringMessages = logs;
      })
    } else {
      this.projectService.getLogsByProjectIdSessionIdAndQuery(this.project.id, this.session.id, this.query, this.fromDate, this.toDate).then((logs)=>{
        this.monitoringMessages = logs;
      })
    }
    console.log(this.query);
  }
  getLog(monitoringMessages) {
    return monitoringMessages.filter((mm) => {
      return mm.log_level == 'NOTIF' || this.filteredLevels.indexOf(mm.log_level)>=0;
    }).sort(function(a, b){return (a.id == b.id) ? 0 : (a.id > b.id) ? 1 : -1;});
  }

}

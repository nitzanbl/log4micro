import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';
import { Project } from './project';
import { ProjectInfo } from './project-info';
import { Session } from './session';
import { Trigger } from './trigger';
import { MmData } from './mm-data';
import 'rxjs/add/operator/toPromise';
import { MonitoringMessage } from './monitoring-message';

@Injectable()
export class ProjectService {
  private base_url: String = 'http://log4micro.codestaq.com/';

  constructor(private http: Http) { }

  getAllProjects(): Promise<Project[]> {
    return this.http.get(this.base_url + '/projects').toPromise().then((res) => res.json() as Project[]);
  }

  createProject(name: string, description: string, level_control: string): Promise<Project> {
    return this.http.post(this.base_url + '/projects', {name, description, level_control}).toPromise()
    .then((res) => res.json() as Project);
  }

  createTrigger(project_id: number, trigger_data_name: string, trigger_condition: string, trigger_value: string, message: string): Promise<Trigger> {
    return this.http.post(this.base_url + '/projects/' + project_id + '/triggers', {project_id, trigger_data_name, trigger_condition, trigger_value, message}).toPromise()
    .then((res) => res.json() as Trigger);
  }
  updateProject(id:number, name: string, description: string): Promise<any> {
    var headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded')
    return this.http.put(this.base_url + '/projects/'+id,
    encodeURI("name=" + name + "&description=" + description),{
      headers: headers
    }).toPromise()
    .then((res) => res.json());
  }
  getProjectById(id: number): Promise<Project> {
    return this.http.get(this.base_url + '/projects/' + id).toPromise().then((res) => res.json() as Project);
  }
  getProjectInfoById(id: number): Promise<ProjectInfo> {
    return this.http.get(this.base_url + '/projects/' + id).toPromise().then((res) => res.json() as ProjectInfo);
  }
  getLogsByProjectId(id: number): Promise<MonitoringMessage[]> {
    return this.http.get(this.base_url + '/projects/' + id + '/logs').toPromise().then((res) => res.json() as MonitoringMessage[]);
  }

  getLogsByProjectIdSessionId(id: number, session_id: number): Promise<MonitoringMessage[]> {
    return this.http.get(this.base_url + '/projects/' + id + '/sessions/' + session_id + '/logs').toPromise().then((res) => res.json() as MonitoringMessage[]);
  }
  getLogsByProjectIdAndQuery(id: number, query: string, fromDate: number, toDate: number): Promise<MonitoringMessage[]> {
    let params: URLSearchParams = new URLSearchParams();
    if (query != '') {
      params.set('message', query);
    }
    if (fromDate > 0) {
      params.set('start_time', fromDate + '');
    }
    if (toDate > 0) {
      params.set('end_time', toDate + '');
    }
    let requestOptions = new RequestOptions();
    requestOptions.search = params;
    return this.http.get(this.base_url + '/projects/' + id + '/logs', requestOptions).toPromise().then((res) => res.json() as MonitoringMessage[]);
  }
  getLogsByProjectIdSessionIdAndQuery(id: number, session_id: number, query: string, fromDate: number, toDate: number): Promise<MonitoringMessage[]> {
    let params: URLSearchParams = new URLSearchParams();
    if (query != '') {
      params.set('message', query);
    }
    if (fromDate > 0) {
      params.set('start_time', fromDate + '');
    }
    if (toDate > 0) {
      params.set('end_time', toDate + '');
    }
    let requestOptions = new RequestOptions();
    requestOptions.search = params;
    return this.http.get(this.base_url + '/projects/' + id + '/sessions/' + session_id + '/logs', requestOptions).toPromise().then((res) => res.json() as MonitoringMessage[]);
  }
  getSessionById(id: number, session_id: number) {
    return this.http.get(this.base_url + '/projects/' + id + '/sessions/' + session_id).toPromise().then((res) => res.json() as Session);
  }

  getDataForLog(id: number, log_id: number) {
    return this.http.get(this.base_url + '/projects/' + id + '/logs/' + log_id + '/data').toPromise().then((res) => res.json() as MmData[]);
  }
  getDataForProject(id: number) {
    return this.http.get(this.base_url + '/projects/' + id + '/data').toPromise().then((res) => res.json() as MmData[]);
  }

  getTriggersByProjectId(id: number) {
    return this.http.get(this.base_url + '/projects/' + id + '/triggers').toPromise().then((res) => res.json() as Trigger[]);
  }

  deleteProject(id:number): Promise<any> {
    return this.http.delete(this.base_url + '/projects/'+id).toPromise()
    .then((res) => res.json());
  }

  deleteTrigger(id:number, trigger_id:number): Promise<any> {
    return this.http.delete(this.base_url + '/projects/'+id+'/triggers/'+trigger_id).toPromise()
    .then((res) => res.json());
  }
}

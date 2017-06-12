import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Project } from './project';
import { ProjectInfo } from './project-info';
import { Session } from './session';
import 'rxjs/add/operator/toPromise';
import { MonitoringMessage } from './monitoring-message';

@Injectable()
export class ProjectService {
  private base_url: String = 'http://log4micro.codestaq.com';

  constructor(private http: Http) { }

  getAllProjects(): Promise<Project[]> {
    return this.http.get(this.base_url + '/projects').toPromise().then((res) => res.json() as Project[]);
  }

  createProject(name: string, description: string, level_control: string): Promise<Project> {
    return this.http.post(this.base_url + '/projects', {name, description, level_control}).toPromise()
    .then((res) => res.json() as Project);
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
  getSessionById(id: number, session_id: number) {
    return this.http.get(this.base_url + '/projects/' + id + '/sessions/' + session_id).toPromise().then((res) => res.json() as Session);
  }
  deleteProject(id:number): Promise<any> {
    return this.http.delete(this.base_url + '/projects/'+id).toPromise()
    .then((res) => res.json());
  }
}

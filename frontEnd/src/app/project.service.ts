import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Project } from './project';
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

  getProjectById(id: number): Promise<Project> {
    return this.http.get(this.base_url + '/projects/' + id).toPromise().then((res) => res.json() as Project);
  }

  getLogsByProjectId(id: number): Promise<MonitoringMessage[]> {
    return this.http.get(this.base_url + '/projects/' + id + '/logs').toPromise().then((res) => res.json() as MonitoringMessage[]);
  }
}

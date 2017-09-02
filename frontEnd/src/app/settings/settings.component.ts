import { Component, OnInit, ViewChild } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {ActivatedRoute, Router} from '@angular/router';
import {MonitoringMessage} from '../monitoring-message';
import {StreamService} from '../stream.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  levels = ["ALL", "DEBUG", "TRACE", "INFO", "WARN", "ERROR", "OFF"]
  project: Project = null;
  // val = 0;
  name = "";
  deleteName = "";
  description = "";
  showDeletePopup = false;
  constructor(private rout: ActivatedRoute, private projectService: ProjectService, private streamService: StreamService, private router: Router) { }

  ngOnInit() {
    this.rout.params.subscribe((params)=>{
      this.projectService.getProjectById(+params['id']).then((proj)=>{
        this.name = proj.name;
        this.description = proj.description;
        this.project = proj;
      
      })
    })
  }
  plainValueChanged(event, container:any) {
    var el = this.getElement(container);
    el.innerText = event.startValue;
  }

  getElement(data):any{
      if (typeof(data)=='string') {
          return document.getElementById(data);
      }
      if (typeof(data)=='object' && data instanceof Element) {
          return data;
      }
      return null;
  }
  handleChange(event) {
    console.log(this.levels[event.value]);
    this.streamService.setLevelControl(this.project.id,this.levels[event.value] )
  }
  // changeLevel(level) {
  //   this.val = level;
  //   this.streamService.setLevelControl(this.project.id,this.levels[level] )
  // }
  saveChanges() {
    this.projectService.updateProject(this.project.id, this.name, this.description).then((a)=>{
      this.project.name = this.name;
      this.project.description = this.description;
    });
  }
  deleteProject() {
    this.projectService.deleteProject(this.project.id).then((a) => {
      this.router.navigate(['/']);
    });
  }

  hideDeletePopup(event) {
    if (event.currentTarget == event.target) {
      this.showDeletePopup = false;
    }
  }
}

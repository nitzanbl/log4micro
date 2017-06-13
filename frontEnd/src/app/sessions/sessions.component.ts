import { Component, OnInit } from '@angular/core';
import {ProjectService} from '../project.service';
import {ProjectInfo} from '../project-info';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit {
  project: ProjectInfo = null;
  constructor(private rout: ActivatedRoute, private projectService: ProjectService) {}

  ngOnInit() {
     this.rout.params.subscribe((params)=>{
      this.projectService.getProjectInfoById(+params['id']).then((proj)=>{
        this.project = proj;
      })});
  }
  getName(session) {
    if(typeof session.name != 'string')
    {
      return 'Untittled Session';
    }
    else 
      return session.name;
  }
}

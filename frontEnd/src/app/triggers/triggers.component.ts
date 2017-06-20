import { Component, OnInit, ViewChild } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {Trigger} from '../trigger';
import {ActivatedRoute, Router} from '@angular/router';
import {MonitoringMessage} from '../monitoring-message';
import {StreamService} from '../stream.service'

@Component({
  selector: 'app-triggers',
  templateUrl: './triggers.component.html',
  styleUrls: ['./triggers.component.css']
})
export class TriggersComponent implements OnInit {
  project: Project = null;
  triggers: Trigger[] = [];
  constructor(private rout: ActivatedRoute, private projectService: ProjectService, private streamService: StreamService, private router: Router) { }

  ngOnInit() {
    this.rout.params.subscribe((params)=>{
      this.projectService.getProjectById(+params['id']).then((proj)=>{
        this.project = proj;
      })
      this.projectService.getTriggersByProjectId(+params['id']).then((trigs)=>{
        var arr = [];
        for (var i = 0; i < trigs.length; i+=1) {
          arr.push(new Trigger(trigs[i]));
        }
        this.triggers = arr;
      })
    })
  }

  removeTriger(t) {
    var i = this.triggers.indexOf(t);
    this.projectService.deleteTrigger(this.project.id, t.id).then((c)=>{
      this.triggers.splice(i, 1);
    })
  }

}

import { Component, OnInit } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-new-trigger',
  templateUrl: './new-trigger.component.html',
  styleUrls: ['./new-trigger.component.css']
})
export class NewTriggerComponent implements OnInit {
  project: Project = null;
  name = '';
  condition = '';
  message = '';
  value = '';
  projectData = [];
  loading = false;
  constructor(private rout: ActivatedRoute, private projectService: ProjectService, private router: Router) { }

  ngOnInit() {
    this.rout.params.subscribe((params)=>{
      this.projectService.getProjectById(+params['id']).then((proj)=>{
        this.project = proj;
      })
      this.projectService.getDataForProject(+params['id']).then((data) => {
        this.projectData = data;
      })
    });
  }

  getType(name) {
    var res = null;
    for (var i = 0; i < this.projectData.length; i+=1) {
      var d = this.projectData[i];
      if (name == d.name) {
        res = d;
        break;
      }
    }
    if (res == null) {
      return -1;
    } else {
      return res.type;
    }
  }

  createTrigger() {
    this.loading = true;
    var cond = '=', val;
    if (this.condition == 'lt') {
      cond = '<';
    } else if (this.condition == 'bt') {
      cond = '>'
    } else if (this.condition == 'lte') {
      cond = '<='
    } else if (this.condition == 'bte') {
      cond = '>='
    }
    var t = this.getType(this.name);
    if (t == -1) {
      return;
    } else if (t == 0) {
      var num = parseInt(this.value);
      var bytes = [
        (num >> 24) & 0xFF,
        (num >> 16) & 0xFF,
        (num >> 8) & 0xFF,
        num & 0xFF
      ];
      val = bytes.map((l)=>{
        return ('0' + (l.toString(16))).substr(-2)
      }).join('')
    } else if (t == 1) {
      val = this.value.split('').map((l)=>{
        return ('0' + (l.charCodeAt(0).toString(16))).substr(-2)
      }).join('')
    } else if (t == 2) {
      if (this.value == 'false') {
        val = '00';
      } else {
        val = 'FF';
      }
    }

    this.projectService.createTrigger(this.project.id, this.name, cond, val, this.message).then((p) => {
      this.router.navigate(['project', p.project_id, 'triggers']);
      this.loading = false;
    });
  }
}

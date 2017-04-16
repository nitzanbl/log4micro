import { Component, OnInit } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
import {Router} from '@angular/router';

@Component({
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.css']
})
export class NewProjectComponent implements OnInit {
  name = '';
  desc = '';
  level_control = 'all';
  loading = false;
  constructor(private projectService: ProjectService, private router: Router) { }

  ngOnInit() {
  }

  createProject() {
    console.log(`name: ${this.name}, desc: ${this.desc}, level-control: ${this.level_control}`);
    this.loading = true;
    this.projectService.createProject(this.name, this.desc, this.level_control).then((p) => {
      this.router.navigate(['project', p.id]);
      this.loading = false;
    });
  }
}

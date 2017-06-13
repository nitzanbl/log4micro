import { Component, OnInit } from '@angular/core';
import {ProjectService} from '../project.service';
import {Project} from '../project';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  projects: Project[] = [];
  rows: Project[][] = [];
  constructor(private projectService: ProjectService) { }

  ngOnInit() {
    this.projectService.getAllProjects().then((proj) => {
      this.projects = proj;
      this.rows = [];
      for (let i = 0; i < this.numRows(); i++) {
        this.rows.push(this.getRow(i));
      }
    });
  }

  numRows(): number {
    return Math.max(Math.ceil((this.projects.length) / 3), 0);
  }

  getRow(i: number) {
    const startIndex = (i) * 3;
    return this.projects.slice(startIndex, startIndex + 3);
  }

}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

// Added improts
import {RouterModule } from '@angular/router';
import {ProjectService} from './project.service';
import { NewProjectComponent } from './new-project/new-project.component';
import { LogViewComponent } from './log-view/log-view.component';
import {StreamService} from './stream.service';



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NewProjectComponent,
    LogViewComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(
      [
        {
          path: 'home',
          component: HomeComponent
        },
        {
          path: '',
          redirectTo: 'home',
          pathMatch: 'full'
        },
        {
          path: 'new_project',
          component: NewProjectComponent
        },
        {
          path: 'project/:id',
          component: LogViewComponent
        }
      ]
    )
  ],
  providers: [
    ProjectService,
    StreamService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

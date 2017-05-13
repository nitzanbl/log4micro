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
import { SettingsComponent } from './settings/settings.component';

import {SliderModule, CheckboxModule} from 'primeng/primeng';
import { DatePickerModule } from 'ng2-datepicker';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NewProjectComponent,
    LogViewComponent,
    SettingsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SliderModule,
    DatePickerModule,
    CheckboxModule,
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
          component: LogViewComponent,
          pathMatch: 'full'
        },
        {
          path: 'project/:id/settings',
          component: SettingsComponent,
          pathMatch: 'full'
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

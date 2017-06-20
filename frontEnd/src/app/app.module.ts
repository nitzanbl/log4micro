import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { SessionsComponent } from './sessions/sessions.component';
import {Daterangepicker} from 'ng2-daterangepicker';
import { TriggersComponent } from './triggers/triggers.component';
import { NewTriggerComponent } from './new-trigger/new-trigger.component'

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NewProjectComponent,
    LogViewComponent,
    SettingsComponent,
    SessionsComponent,
    TriggersComponent,
    NewTriggerComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SliderModule,
    BrowserAnimationsModule,
    DatePickerModule,
    Daterangepicker,
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
          component: SessionsComponent,
          pathMatch: 'full'
        },
        {
          path: 'project/:id/triggers',
          component: TriggersComponent,
          pathMatch: 'full'
        },
        {
          path: 'project/:id/new_trigger',
          component: NewTriggerComponent,
          pathMatch: 'full'
        },
        {
          path: 'project/:id/session/:session_id',
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

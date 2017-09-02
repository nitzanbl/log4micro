import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

@Injectable()
export class StreamService {
  private url = 'http://api.log4micro.com:8080';
  private socket = null;

  constructor() { this.socket = io(this.url);}

  getMessages() {
    let observable = new Observable(observer => {

      this.socket.on('message', (data) => {
        console.log(data);
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    })
    return observable;
  }

  setLevelControl(project_id, level_control) {
    this.socket.send({project_id: project_id, log_level: level_control})
  }

}

import { Component, Input } from '@angular/core';

import { Server, ServersService, FileService } from '../../core';

import * as fileSaver from 'file-saver';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-server-preview',
  templateUrl: './server-preview.component.html',
  styleUrls: ['server-preview.component.scss'],
})
export class ServerPreviewComponent {
  constructor(
    private serverService: ServersService,
    private fileService: FileService
  ) { }
  @Input() server: Server;
  target = 'all';
  errors = {};
  color = 'primary';
  mode = 'determinate';
  value = 0;
  getToken() {
    this.serverService.getToken(this.server.slug).subscribe(
      (serverData) => {
        this.server = serverData;
      }
    );
  }
  download() {
    this.value = 0; this.mode = 'indeterminate'; this.color = 'primary';
    this.fileService
      .downloadFile(this.server.slug, this.target)
      .subscribe(
        data => {
          () => console.info('File downloaded successfully');
          this.mode = 'determinate'; this.color = 'accent'; this.value = 100;
          let blob: any = new Blob([data]);
          fileSaver.saveAs(blob, this.server.slug + '.zip');
        }), err => {
          this.errors = err;
          this.mode = 'determinate'; this.color = 'warn'; this.value = 100;
        }
  }
}

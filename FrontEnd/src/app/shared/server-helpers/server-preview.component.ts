import { Component, Input } from '@angular/core';

import { Server, ServersService } from '../../core';

@Component({
  selector: 'app-server-preview',
  templateUrl: './server-preview.component.html',
})
export class ServerPreviewComponent {
  constructor(
    private serverService: ServersService
  ) { }
  @Input() server: Server;
  getToken() {
    this.serverService.getToken(this.server.slug).subscribe(
      (serverData) => {
        this.server = serverData;
      }
    );
  }
}

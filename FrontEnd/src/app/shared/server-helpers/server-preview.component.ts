import { Component, Input } from '@angular/core';

import { Server } from '../../core';

@Component({
  selector: 'app-server-preview',
  templateUrl: './server-preview.component.html'
})
export class ServerPreviewComponent {
  @Input() server: Server;
}

import { Component, Input } from '@angular/core';

import { Server } from '../../core';

@Component({
  selector: 'app-server-meta',
  templateUrl: './server-meta.component.html'
})
export class ServerMetaComponent {
  @Input() server: Server;
}

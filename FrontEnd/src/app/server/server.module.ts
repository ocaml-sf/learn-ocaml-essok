import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ServerComponent } from './server.component';
import { ServerResolver } from './server-resolver.service';
import { MarkdownPipe } from './markdown.pipe';
import { SharedModule } from '../shared';
import { ServerRoutingModule } from './server-routing.module';
import { ServerSettingsComponent } from './server-settings.component';

@NgModule({
  imports: [
    SharedModule,
    ServerRoutingModule
  ],
  declarations: [
    ServerComponent,
    ServerSettingsComponent,
    MarkdownPipe
  ],

  providers: [
    ServerResolver
  ]
})
export class ServerModule {}

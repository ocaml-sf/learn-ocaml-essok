import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ServerSettingsComponent } from './server-settings.component';
import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { ServerSettingsRoutingModule } from './server-settings-routing.module';

@NgModule({
  imports: [
    SharedModule,
    ServerSettingsRoutingModule
  ],
  declarations: [
    ServerSettingsComponent
  ]
})
export class ServerSettingsModule {}

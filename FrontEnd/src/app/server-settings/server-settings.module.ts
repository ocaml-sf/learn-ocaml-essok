import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared';
import { ServerSettingsComponent } from './server-settings.component';
import { ServerSettingsRoutingModule } from './server-settings-routing.module';
import { ServerSettingsResolver } from './server-settings-resolver.service';

@NgModule({
  imports: [
    SharedModule,
    ServerSettingsRoutingModule
  ],
  declarations: [
    ServerSettingsComponent
  ],

  providers: [
    ServerSettingsResolver
  ]
})
export class ServerSettingsModule {}

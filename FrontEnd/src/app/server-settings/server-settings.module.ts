import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared';
import { ServerSettingsComponent } from './server-settings.component';
import { ServerSettingsRoutingModule } from './server-settings-routing.module';
import { ServerSettingsResolver } from './server-settings-resolver.service';
import { FileSelectDirective } from 'ng2-file-upload';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressBarModule } from '@angular/material';

@NgModule({
  imports: [
    SharedModule,
    ServerSettingsRoutingModule,
  ],
  declarations: [
    ServerSettingsComponent,
    FileSelectDirective
  ],

  providers: [
    ServerSettingsResolver
  ]
})
export class ServerSettingsModule { }

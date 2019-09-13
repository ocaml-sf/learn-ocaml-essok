import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling'; 
import { SharedModule } from '../shared';
import { ServerSettingsComponent } from './server-settings.component';
import { ServerSettingsRoutingModule } from './server-settings-routing.module';
import { ServerSettingsResolver } from './server-settings-resolver.service';
import { FileSelectDirective } from 'ng2-file-upload';

@NgModule({
  imports: [
    SharedModule,
    ServerSettingsRoutingModule,
    DragDropModule,
    ScrollingModule
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

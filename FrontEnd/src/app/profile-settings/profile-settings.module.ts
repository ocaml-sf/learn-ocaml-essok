import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProfileSettingsComponent } from './profile-settings.component';
import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { ProfileSettingsRoutingModule } from './profile-settings-routing.module';

@NgModule({
  imports: [
    SharedModule,
    ProfileSettingsRoutingModule
  ],
  declarations: [
    ProfileSettingsComponent
  ]
})
export class ProfileSettingsModule { }

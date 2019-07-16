import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProfileSettingsComponent } from './profile-settings.component';
import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { ProfileSettingsRoutingModule } from './profile-settings-routing.module';
import { ProfileSettingsResolver } from './profile-settings-resolver.service';

@NgModule({
  imports: [
    SharedModule,
    ProfileSettingsRoutingModule
  ],
  declarations: [
    ProfileSettingsComponent
  ],
  providers: [
    ProfileSettingsResolver
  ]
})
export class ProfileSettingsModule { }

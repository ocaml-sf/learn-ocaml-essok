import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProfileServersComponent } from './profile-servers.component';
import { ProfileComponent } from './profile.component';
import { ProfileResolver } from './profile-resolver.service';
import { SharedModule } from '../shared';
import { ProfileRoutingModule } from './profile-routing.module';

@NgModule({
  imports: [
    SharedModule,
    ProfileRoutingModule
  ],
  declarations: [
    ProfileServersComponent,
    ProfileComponent,
  ],
  providers: [
    ProfileResolver
  ]
})
export class ProfileModule {}

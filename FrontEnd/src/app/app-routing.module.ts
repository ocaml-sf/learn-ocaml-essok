import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

const routes: Routes = [
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule'
  },
  {
    path: 'profile-settings',
    loadChildren: './profile-settings/profile-settings.module#ProfileSettingsModule'
  },
  {
    path: 'profile',
    loadChildren: './profile/profile.module#ProfileModule'
  },
  {
    path: 'editor',
    loadChildren: './editor/editor.module#EditorModule'
  },
  {
    path: 'reset-password',
    loadChildren: './reset-password/reset-password.module#ResetPasswordModule'
  },
  {
    path: 'delete-account',
    loadChildren: './delete-account/delete-account.module#DeleteAccountModule'
  },
  {
    path: 'disable-account',
    loadChildren: './disable-account/disable-account.module#DisableAccountModule'
  },
  {
    path: 'server',
    loadChildren: './server/server.module#ServerModule'
  },
  {
    path: 'server-settings',
    loadChildren: './server-settings/server-settings.module#ServerSettingsModule'
  },
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: '**', redirectTo: '/', pathMatch: 'full' }

  // { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // preload all modules; optionally we could
    // implement a custom preloading strategy for just some
    // of the modules (PRs welcome 😉)
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

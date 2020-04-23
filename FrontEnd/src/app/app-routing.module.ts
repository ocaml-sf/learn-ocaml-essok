import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'profile-settings',
    loadChildren: () => import('./profile-settings/profile-settings.module').then(m => m.ProfileSettingsModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule)
  },
  {
    path: 'editor',
    loadChildren: () => import('./editor/editor.module').then(m => m.EditorModule)
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./reset-password/reset-password.module').then(m => m.ResetPasswordModule)
  },
  {
    path: 'delete-account',
    loadChildren: () => import('./delete-account/delete-account.module').then(m => m.DeleteAccountModule)
  },
  {
    path: 'disable-account',
    loadChildren: () => import('./disable-account/disable-account.module').then(m => m.DisableAccountModule)
  },
  {
    path: 'server',
    loadChildren: () => import('./server/server.module').then(m => m.ServerModule)
  },
  {
    path: 'server-settings',
    loadChildren: () => import('./server-settings/server-settings.module').then(m => m.ServerSettingsModule)
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

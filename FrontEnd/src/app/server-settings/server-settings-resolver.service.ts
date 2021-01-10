import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { Server, ServersService, UserService } from '../core';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ServerSettingsResolver implements Resolve<Server> {
  constructor(
    private serversService: ServersService,
    private router: Router,
    private userService: UserService
  ) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {

    return this.serversService.get(route.params['slug'])
      .pipe(
        map(
          server => {
            if (this.userService.getCurrentUser().username === server.author.username || this.userService.getCurrentUser().admin) {
              return server;
            } else {
              this.router.navigateByUrl('/');
            }
          }
        ),
        catchError((err) => this.router.navigateByUrl('/'))
      );
  }
}

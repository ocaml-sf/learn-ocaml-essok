import { Injectable, } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { Server, ServersService, UserService } from '../core';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ServerResolver implements Resolve<Server> {
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
      .pipe(catchError((err) => this.router.navigateByUrl('/')));
  }
}

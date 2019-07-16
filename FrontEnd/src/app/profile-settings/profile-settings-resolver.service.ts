import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { Server, ProfilesService } from '../core';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ProfileSettingsResolver implements Resolve<Server> {
    constructor(
        private router: Router,
        private profilesService: ProfilesService

    ) { }

    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> {


        return this.profilesService.get(route.params['username'])
            .pipe(catchError((err) => this.router.navigateByUrl('/')));

    }
}

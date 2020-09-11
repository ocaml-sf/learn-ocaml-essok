import { Injectable, EventEmitter } from "@angular/core";
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable()
export class FilterService {

    // Observable string sources
    private isActive = new Subject<boolean>();
    private isAuthorized = new Subject<boolean>();

    // Observable string streams
    isActive$ = this.isActive.asObservable();
    isAuthorized$ = this.isAuthorized.asObservable();

    // Service message commands
    getActive(filter: boolean) {
        this.isActive.next(filter);
    }

    getAuthorized(filter: boolean) {
        this.isAuthorized.next(filter);
    }
}
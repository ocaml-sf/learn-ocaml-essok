import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class FileService {

    constructor(private apiService: ApiService) { }

    downloadFile(slug: string, target : Object): Observable<any> {

        return this.apiService
            .download('/uploads/download/' + slug, { target: target })
            .pipe(map(data => data));
    }
}

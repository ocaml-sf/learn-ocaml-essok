import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams, HttpResponse, HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';

import { Http, ResponseContentType } from '@angular/http';
import { Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { map, tap, last, catchError } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class FileService {

    constructor(private apiService: ApiService) { }

    downloadFile(slug, target): Observable<any> {

        return this.apiService.download('/uploads/download/' + slug, { target: target });

    }

}

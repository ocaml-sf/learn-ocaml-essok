import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Server, ServersService } from '../core';
import { FileUploader, FileSelectDirective } from 'ng2-file-upload/ng2-file-upload';

const URL = 'http://localhost:3000/api/uploads';

@Component({
  selector: 'app-server-settings-page',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.css']
})
export class ServerSettingsComponent implements OnInit {
  server: Server = {} as Server;
  serverSettingsForm: FormGroup;
  errors: Object = {};
  uploadErrors: string;
  isSubmitting = false;
  uploader: FileUploader = new FileUploader({ url: URL });
  hasBaseDropZoneOver: boolean;
  hasAnotherDropZoneOver: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private serversService: ServersService,
    private fb: FormBuilder,

  ) {
    // create form group using the form builder
    this.serverSettingsForm = this.fb.group({
      title: '',
      description: '',
      url: '',
      file: '',
      password_verification: ''
    });
  }

  ngOnInit() {
    this.route.data.subscribe((data: { server: Server }) => {
      if (data.server) {
        this.server = data.server;
        this.serverSettingsForm.patchValue(data.server);
      }
    });
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      console.log('FileUpload:uploaded:', item, status, response);
      this.uploadErrors = response;
    };
    this.router.navigateByUrl('/server/server-settings/' + this.server.slug);

  }
  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  submitForm() {
    this.isSubmitting = true;

    // update the model
    this.updateServer(this.serverSettingsForm.value);

    // post the changes
    this.serversService.save(this.server).subscribe(
      server => this.router.navigateByUrl('/server/' + server.slug),
      err => {
        this.errors = err;
        this.isSubmitting = false;
      }
    );
  }

  updateServer(values: Object) {
    Object.assign(this.server, values);
  }

}

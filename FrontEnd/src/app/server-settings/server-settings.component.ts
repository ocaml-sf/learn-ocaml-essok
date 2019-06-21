import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { Server, ServersService } from '../core';

@Component({
  selector: 'app-server-settings-page',
  templateUrl: './server-settings.component.html'
})
export class ServerSettingsComponent implements OnInit {
  server: Server = {} as Server;
  serverSettingsForm: FormGroup;
  errors: Object = {};
  isSubmitting = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private serversService: ServersService,
    private fb: FormBuilder
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

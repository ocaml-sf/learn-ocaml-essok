import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Server, ServersService } from '../core';

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor.component.html'
})
export class EditorComponent implements OnInit {
  server: Server = {} as Server;
  serverForm: FormGroup;
  errors: Object = {};
  isSubmitting = false;

  constructor(
    private serversService: ServersService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // use the FormBuilder to create a form group
    this.serverForm = this.fb.group({
      title: '',
      description: '',
    });


    // Optional: subscribe to value changes on the form
    // this.serverForm.valueChanges.subscribe(value => this.updateServer(value));
  }

  ngOnInit() {
    // If there's an server prefetched, load it
    this.route.data.subscribe((data: { server: Server }) => {
      if (data.server) {
        this.server = data.server;
        this.serverForm.patchValue(data.server);
      }
    });
  }

  submitForm() {
    this.isSubmitting = true;

    // update the model
    this.updateServer(this.serverForm.value);

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

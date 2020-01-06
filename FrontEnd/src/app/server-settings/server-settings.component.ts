import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Server, ServersService, ApiService, JwtService, ExercisesList } from '../core';
import { FileUploader, FileSelectDirective, FileUploaderOptions } from 'ng2-file-upload/ng2-file-upload';
// import { FileService } from '../core/services/file.service';
import { map } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ModalService } from '../modal';

const URL = 'http://localhost:3000/api/uploads/check';

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
  tmp: string;
  isSubmitting = false;
  uploader: FileUploader;
  hasBaseDropZoneOver: boolean;
  hasAnotherDropZoneOver: boolean;
  isDeleting = false;
  isDisabled = true;
  isChecked = false;
  isAssuming = false;
  isSending = false;
  exercises: any[];
  idIndex = 1;
  exercisesList = [];
  groups: String[][];
  groupsList = [];
  allExercisesID = ['exercises-list', 'create-group',
    ...this.groupsList.map(group => group.id)];
  useless: ExercisesList = {} as ExercisesList;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private serversService: ServersService,
    private fb: FormBuilder,
    private jwtService: JwtService,
    private modalService: ModalService,
    // private fileService: FileService
  ) {
    // create form group using the form builder
    this.serverSettingsForm = this.fb.group({
      // title: '',
      // description: '',
      url: '',
      // file: '',
    });

    const token = this.jwtService.getToken();
    this.uploader = new FileUploader(
      {
        url: URL,
        authToken: `Token ${token}`,
        allowedMimeType: ['application/zip', 'application/octet-stream'/*, 'application/gzip'*/],
      }
    );
  }

  generateGroupID() {
    return 'group' + (this.idIndex++);
  }

  ngOnInit() {
    this.loadData();
    this.loadGroups();
    this.uploadPrepare();
    this.router.navigateByUrl('/server-settings/' + this.server.slug);
  }

  loadData() {
    this.route.data.subscribe((data: { server: Server }) => {
      if (data.server) {
        this.server = data.server;
        // this.serverSettingsForm.patchValue(data.server);
        this.uploader.options.additionalParameter = { server: this.server.slug };
      }
    });
  }

  loadGroups() {
    this.serversService.getGroups(this.server.slug).subscribe(
      data => {
        this.useless = JSON.parse(JSON.stringify(data));
        this.groupsList = this.useless.group.map(
          group => { return { ...group, id: this.generateGroupID() }; });
        this.exercisesList = this.useless.name;
      },
      err => {
        this.errors = err;
      }
    )
  }

  uploadPrepare() {
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      console.log('FileUpload:uploaded:', item, status, response);
      this.useless = JSON.parse(response);
      this.exercisesList = this.useless.name;
      this.idIndex = 1;
      // move to the next slide
    };
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  submitForm() {
    this.isSubmitting = true;
    this.modalService.open('pleaseWait2');
    this.serversService.uploadFromUrl(this.server.slug, this.serverSettingsForm.value).subscribe(

      data => {
        this.modalService.close('pleaseWait2');
        this.useless = JSON.parse(JSON.stringify(data));
        this.exercisesList = this.useless.name;
        this.groupsList = [];
        this.idIndex = 1;
      },
      err => {
        this.modalService.close('pleaseWait2');
        this.errors = err;
        this.isSubmitting = false;
      }
    );
  }

  updateServer(values: Object) {
    Object.assign(this.server, values);
  }

  deleteServer() {
    if (this.isChecked && this.isAssuming) {
      this.isDeleting = true;
      this.modalService.open('pleaseWait2');
      this.serversService.destroy(this.server.slug)
        .subscribe(
          success => {
            this.modalService.close('pleaseWait2');
            this.router.navigateByUrl('/');
          }
        );
    }
  }

  disableServer() {
    this.isDisabled = true;
    this.isSending = true;
    this.modalService.open('pleaseWait2');
    this.serversService.disable(this.server.slug)
      .subscribe(
        success => {
          this.modalService.close('pleaseWait2');
          this.router.navigateByUrl('/');
        }
      );
  }

  assumeDelete() {
    this.isAssuming = !this.isAssuming;
  }

  understandDelete() {
    this.isChecked = !this.isChecked;
  }
  // download() {
  //   this.fileService.downloadFile().subscribe(response => {
  //     // let blob:any = new Blob([response.blob()], { type: 'text/json; charset=utf-8' });
  //     // const url= window.URL.createObjectURL(blob);
  //     // window.open(url);
  //     window.location.href = response.url;
  //     // fileSaver.saveAs(blob, 'employees.json');
  //   }, error => console.log('Error downloading the file'),
  //     () => console.log('File downloaded successfully'));
  // }

  send() {
    this.groups = [[]];
    this.modalService.open('pleaseWait2');
    this.groupsList.forEach(element => {
      this.groups.push([element.title].concat(element.exercises));
    });
    this.serversService.send(this.server.slug, this.exercisesList, this.groups).subscribe(
      data => {
        this.modalService.close('pleaseWait2');
        this.isDisabled = false;
      },
      err => {
        this.modalService.close('pleaseWait2');
        this.errors = err;
        this.isSubmitting = false;
      }
    );
  }

  dropExercise(event: CdkDragDrop<string[]>) {
    const previousContainer = event.previousContainer;
    if (previousContainer === event.container) {
      moveItemInArray(event.container.data,
        event.previousIndex,
        event.currentIndex);
    } else {
      transferArrayItem(previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
    this.deleteGroupCheck(previousContainer.id, previousContainer.data);
  }

  dropGroup(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.groupsList,
      event.previousIndex, event.currentIndex);
    console.log(this.groupsList);
  }

  createGroup(event: CdkDragDrop<string[]>) {
    const title = this.generateGroupID();
    const newGroup = { id: title, title: title, exercises: [] };
    const previousContainer = event.previousContainer;

    this.groupsList.push(newGroup);
    this.allExercisesID.push(title);
    transferArrayItem(event.previousContainer.data,
      newGroup.exercises,
      event.previousIndex,
      0);
    this.deleteGroupCheck(previousContainer.id, previousContainer.data);
  }

  deleteGroupCheck(id, data) {
    if (id !== 'exercises-list' && data.length === 0) {
      this.groupsList = this.groupsList.filter(group => group.id !== id);
      this.allExercisesID = this.allExercisesID.filter(iId => iId !== id);
      console.log(this.groupsList);
      console.log(this.allExercisesID);
    }
  }
}

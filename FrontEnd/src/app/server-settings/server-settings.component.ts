import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Server, ServersService, ApiService, JwtService, ExercisesList } from '../core';
import { FileUploader } from 'ng2-file-upload/';
// import { FileService } from '../core/services/file.service';
import { map } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ModalService } from '../modal';
import { environment } from '../../environments/environment';
import { ConfirmDialogService } from '../confirm';
import { IMGPANELS } from './imgPanelServerSettings';

const URL = environment.api_url + '/uploads/check';
const URL_full = environment.api_url + '/uploads/full';

interface Group {
  id: string;
  title: string;
  exercises: string[];
}

@Component({
  selector: 'app-server-settings-page',
  templateUrl: './server-settings.component.html',
})
export class ServerSettingsComponent implements OnInit {
  server: Server = {} as Server;
  serverSettingsForm: FormGroup;
  errors: Object = {};
  uploadErrors: string;
  tmp: string;
  isSubmitting = false;
  uploader: FileUploader;
  uploader_full: FileUploader;
  hasBaseDropZoneOver: boolean;
  hasAnotherDropZoneOver: boolean;
  isDeleting: boolean = false;
  isDisabled: boolean = true;
  isConfirmingDelete: boolean = false;
  isAssumingDelete: boolean = false;
  isSending: boolean = false;
  exercises: any[];
  idIndex: number = 1;
  exercisesList: string[] = [];
  trashList: string[] = [];
  exercisesDropList: string[] = [];
  trashDropList: string[] = [];
  groupsList: Group[] = [];
  IMGPANELS = IMGPANELS;
  uploadHeaders: string[] = ['name', 'size', 'status'];
  dangerousZonePanelState: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private serversService: ServersService,
    private fb: FormBuilder,
    private jwtService: JwtService,
    private modalService: ModalService,
    private confirmDialogService: ConfirmDialogService,
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
        authToken: `Token ${token}`
        //allowedMimeType: ['application/zip', 'application/octet-stream'/*, 'application/gzip'*/],
      }
    );
    this.uploader_full = new FileUploader(
      {
        url: URL_full,
        authToken: `Token ${token}`
        //allowedMimeType: ['application/zip', 'application/octet-stream'/*, 'application/gzip'*/],
      }
    );
  }

  updateExercisesDropList() {
    this.exercisesDropList = ['trash-list', 'exercises-list', 'create-group-list',
      ...this.groupsList.map(group => group.id)];
  }

  generateGroupID() {
    return 'group' + (this.idIndex++);
  }

  ngOnInit() {
    this.loadData();
    this.loadGroups();
    this.uploadPrepare();
    this.uploadFullPrepare();
    this.router.navigateByUrl('/server-settings/' + this.server.slug);
  }

  loadData() {
    this.route.data.subscribe((data: { server: Server }) => {
      if (data.server) {
        this.server = data.server;
        // this.serverSettingsForm.patchValue(data.server);
        this.uploader.options.additionalParameter = { server: this.server.slug };
        this.uploader_full.options.additionalParameter = { server: this.server.slug };
      }
    });
  }

  loadGroups() {
    this.serversService
      .getGroups(this.server.slug)
      .subscribe(data => {
        const groups =
          data.groups as { [id: string]: { title: string, exercises: string[] }}
        this.groupsList = Object.entries(groups)
          .map(([id, group]) => ({ id, ...group }))
        this.updateExercisesDropList()
        this.exercisesList = data.exercisesList;
        this.trashList = [];
        this.errors = {};
      }, err => { this.errors = err })
  }

  uploadPrepare() {
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, res: any, status: any, headers: any) => {
      console.log('FileUpload:uploaded:', item, status, res);
      this.exercisesList = res.name;
      this.trashList = [];
      this.loadGroups();
      // move to the next slide
    };
  }

  uploadFullPrepare() {
    this.uploader_full.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader_full.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      console.log('FileUpload:uploaded:', item, status, response);
      let that = this;
      this.confirmDialogService.confirmThis("Launch your learnOCaml server now?", function () {
        that.disableServer();
      }, function () {
        alert("The operation has been aborted, you can launch it later");
      })
    };
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  uploadURL() {
    this.isSubmitting = true;
    this.serversService.uploadFromUrl(this.server.slug, this.serverSettingsForm.value).subscribe(

      data => {
        this.exercisesList = data.name;
        this.loadGroups();
      },
      err => {
        this.errors = err;
        this.isSubmitting = false;
      }
    );
  }

  uploadFullURL() {
    this.isSubmitting = true;
    this.serversService.uploadFromUrl(this.server.slug, this.serverSettingsForm.value).subscribe(

      data => {
        this.exercisesList = data.name;
        this.loadGroups();
      },
      err => {
        this.errors = err;
        this.isSubmitting = false;
      }
    );
  }

  updateServer(values: Object) {
    Object.assign(this.server, values);
  }

  deleteServer() {
    if (this.isConfirmingDelete && this.isAssumingDelete) {
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

  send() {
    let groups = this.groupsList
      .reduce((acc, { id, ...group }) => ({ ...acc, [id]: group }), {})
    this.serversService.send(this.server.slug, this.exercisesList, groups,
                             this.trashList)
      .subscribe(_res => {
        this.isDisabled = false;
        this.loadGroups();
        let that = this;
        this.confirmDialogService.confirmThis("Launch your learnOCaml server now?", function () {
          that.disableServer();
        }, function () {
          alert("The operation has been aborted, you can launch it later");
        })
      },
      err => {
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
    this.updateExercisesDropList();
    transferArrayItem(event.previousContainer.data,
      newGroup.exercises,
      event.previousIndex,
      0);
    this.groupsList = [...this.groupsList];
    this.deleteGroupCheck(previousContainer.id, previousContainer.data);
  }

  deleteGroupCheck(id: string, data) {
    if ((id !== 'exercises-list') && (id !== 'trash-list') && (data.length === 0)) {
      this.groupsList = this.groupsList.filter(group => group.id !== id);
      this.updateExercisesDropList();
      console.log(this.groupsList);
      console.log(this.exercisesDropList);
    }
  }
  // how it works
  showDialog() {
    this.confirmDialogService.confirmThis("Are you sure to delete?", function () {
      alert("Yes clicked");
    }, function () {
      alert("No clicked");
    })
  }
}

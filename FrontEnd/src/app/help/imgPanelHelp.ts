import { ImgPanel } from '../shared/expansion-img-panels/imgPanel';
import { addImgsDirPath } from '../shared/expansion-img-panels/imgPanelAssets';

const CREATESERVER : ImgPanel[] =
  [
    {
      description: 'Example of server creation',
      src : 'create_server.png',
    },
    {
      description: 'Example of server creation error',
      src: 'create_server_bug.png',
    },
    {
      description: 'Example of correct server creation',
      src: 'create_server_correct.png'
    },
  ];

const MANAGESERVER : ImgPanel[] =
  [
    {
      description: 'Example of server selection',
      src: 'select_server.png',
    },
    {
      description: 'Example of server management',
      src: 'manage_server.png',
    },
  ];

const UPLOADFILES : ImgPanel[] =
  [
    { src: 'upload_file_empty.png' },
    { src: 'upload_file_github.png' },
    { src: 'upload_file_local.png' },
    { src: 'exercises_yes.png' },
    { src: 'exercises_no.png' },
    { src: 'upload_file_local_example.png' },
    { src: 'upload_file_local_example_done.png' },
  ];

const MANAGEFILES : ImgPanel[] =
  [
    {
      description: 'Example of send empty',
      src: 'send_file_empty.png',
    },
    {
      description: 'Example of send example',
      src: 'send_file_example.png',
    },
  ];

const EXERCISESLIST : ImgPanel[] =
  [
    {
      description: 'Example of send move',
      src: 'send_move.png',
    },
    {
      description: 'Example of send place',
      src: 'send_place.png',
    },
    {
      description: 'Example of send place drop',
      src: 'send_file_place_group.png',
    },
  ];

const TRASH : ImgPanel[] =
  [
    {
      description: 'Example of trash move',
      src: 'send_file_trash_move.png',
    },
    {
      description: 'Example of trash place',
      src: 'send_file_trash_place.png',
    },
    {
      description: 'Example of clean',
      src: 'send_file_clean.png',
    },
  ];

const GROUPLIST : ImgPanel[] =
  [
    {
      description: 'Example of group move',
      src: 'send_file_group_move.png',
    },
    {
      description: 'Example of group place',
      src: 'send_file_group_place.png',
    },
    {
      description: 'Example of group rename',
      src: 'send_file_group_rename_select.png',
    },
    {
      description: 'Example of group renamed',
      src: 'send_file_group_rename_done.png',
    },
    {
      description: 'Example of reset',
      src: 'send_file_reset.png',
    },
    {
      description: 'Example of send',
      src: 'send_file_send.png',
    },
    {
      description: 'Example of group validate',
      src: 'send_file_group_validate.png',
    },
    {
      description: 'Example of wait',
      src: 'send_file_wait.png',
    },
    {
      description: 'Example of launch',
      src: 'send_file_launch.png',
    },
    {
      description: 'Example of launch yes',
      src: 'send_file_launch_yes.png',
    },
  ];

const TEACHERTOKEN : ImgPanel[] =
  [
    {
      description: 'Example of teacher token',
      src: 'teacher_token.png',
    },
    {
      description: 'Example of teacher token click',
      src: 'teacher_token_click.png',
    },
    {
      description: 'Example of teacher token wait',
      src: 'teacher_token_wait.png',
    },
    {
      description: 'Example of teacher token success',
      src: 'teacher_token_retrieve.png',
    },
    {
      description: 'Example of teacher token copy',
      src: 'teacher_token_copy.png',
    },
  ];

const ACCESSSERVER : ImgPanel[] =
  [
    {
      description: 'Example of access server',
      src: 'access_server.png',
    },
    {
      description: 'Example of access server welcome',
      src: 'access_server_welcome.png',
    },
    {
      description: 'Example of access server paste',
      src: 'access_server_paste.png',
    },
    {
      description: 'Example of access server done',
      src: 'access_server_done.png',
    },
  ];

const SHUTOFF : ImgPanel[] =
  [
    {
      description: 'Example of shut off',
      src: 'shut_off.png',
    },
    {
      description: 'Example of shut on',
      src: 'shut_on.png',
    },
  ];

const DANGEROUS: ImgPanel[] =
  [
    {
      description: 'Example of dangerous actions',
      src: 'dangerous.png',
    },
  ];

const PASSWORD: ImgPanel[] =
  [
    {
      description: 'Example of reset password',
      src: 'reset_pass.png',
    },
  ];

const DELETESERVER: ImgPanel[] =
  [
    {
      description: 'Example of server delete',
      src: 'delete_server.png',
    },
  ];

const DISABLEACCOUNT : ImgPanel[] =
  [
    {
      description: 'Example of account disable',
      src: 'disable_acc.png',
    },
  ];

const DELETEACCOUNT : ImgPanel[] =
  [
    {
      description: 'Example of account delete',
      src: 'delete_acc.png',
    },
  ];

let _IMGPANELS = {
    CREATESERVER,
    MANAGESERVER,
    UPLOADFILES,
    MANAGEFILES,
    EXERCISESLIST,
    TRASH,
    GROUPLIST,
    TEACHERTOKEN,
    ACCESSSERVER,
    SHUTOFF,
    DANGEROUS,
    PASSWORD,
    DELETESERVER,
    DISABLEACCOUNT,
    DELETEACCOUNT,
};

Object.keys(_IMGPANELS)
  .map((key: string) => {
    _IMGPANELS[key] = addImgsDirPath(_IMGPANELS[key]);
  });

export const IMGPANELS = _IMGPANELS;

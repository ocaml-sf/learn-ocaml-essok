import { ImgPanel } from './imgPanel';

const IMGSDIRPATH : string = '../../assets/images/';

export function addImgDirPath(imgPanel : ImgPanel) {
  return {...imgPanel, src: IMGSDIRPATH + imgPanel.src};
}

export function addImgsDirPath(imgPanels : ImgPanel[]) {
  return imgPanels.map(addImgDirPath);
}

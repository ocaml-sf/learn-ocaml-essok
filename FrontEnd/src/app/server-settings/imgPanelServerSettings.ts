import { ImgPanel } from '../shared/expansion-img-panels/imgPanel';
import { addImgsDirPath } from '../shared/expansion-img-panels/imgPanelAssets';

const ARCHIVE : ImgPanel[] = [
  {
    src: 'exercises_yes.png',
  },
]

let _IMGPANELS = {
  ARCHIVE,
}

Object.keys(_IMGPANELS)
  .map((key: string) => {
    _IMGPANELS[key] = addImgsDirPath(_IMGPANELS[key]);
  });

export const IMGPANELS = _IMGPANELS;

import path from 'path'

import {
  DataKind,
  dirToFileOutput,
  InputData as ObjectData,
  OutputData as ObjectDataOptions
} from 'utils/Data'

export type ContainerName = string
export type ObjectName = string

export interface CloudService {
  listContainers(): Promise<ContainerName[]>
  createContainer(name: ContainerName): Promise<void>
  deleteContainer(name: ContainerName): Promise<void>

  listObjects(name: ContainerName): Promise<ObjectName[]>
  downloadObject(cName: ContainerName, oName: ObjectName,
                 oOptions: ObjectDataOptions): Promise<ObjectData>
  uploadObject(cName: ContainerName,
               oName: ObjectName, oData: ObjectData): Promise<void>
  deleteObject(cName: ContainerName, oName: ObjectName): Promise<void>
}

type ApplyFun<T> = (oName: string, index: number) => Promise<T>
async function applyObjects<T>(cloud: CloudService, cName: ContainerName,
                            apply: ApplyFun<T>)
: Promise<T[]> {
  const oNames = await cloud.listObjects(cName)
  return Promise.all(oNames.map(apply))
}

type DirectoryDataOption = ObjectDataOptions
export type AllObjsDataOptions = DirectoryDataOption | ObjectDataOptions[]
export async function downloadObjects(cloud: CloudService,
                                         cName: ContainerName,
                                         oOptions: AllObjsDataOptions)
: Promise<ObjectData[]> {
  const applyFun = (oName: string, objiOptions: ObjectDataOptions) =>
    cloud.downloadObject(cName, oName, objiOptions)
  const applyFunOptions = (Array.isArray(oOptions)) ?
    (oName: string, i: number) => applyFun(oName, oOptions[i])
  : (oName: string) => applyFun(oName, dirToFileOutput(oOptions, oName))

  return applyObjects(cloud, cName, applyFunOptions)
}

export async function copyObjects(cloud: CloudService,
                                     cNameSrc: ContainerName,
                                     cNameDst: ContainerName): Promise<void> {
  await applyObjects(cloud, cNameSrc, async (oName: string) => {
    const objBufferData =
      await cloud.downloadObject(cNameSrc, oName, { kind: DataKind.Buffer })
    await cloud.uploadObject(cNameDst, oName, objBufferData)
  })
}

export async function deleteObjects(cloud: CloudService,
                                       cName: ContainerName): Promise<void> {
  await applyObjects(cloud, cName, oName => cloud.deleteObject(cName, oName))
}

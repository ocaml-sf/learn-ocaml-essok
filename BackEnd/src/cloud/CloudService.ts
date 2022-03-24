import path from 'path'

import {
  DataKind,
  InputData as ObjectData,
  outPathData,
  OutputData as ObjectDataOptions
} from 'utils/Data'

export type ContainerName = string
export type ObjectName = string

export abstract class CloudService {
  abstract listContainers(): Promise<ContainerName[]>
  abstract createContainer(name: ContainerName): Promise<void>
  abstract deleteContainer(name: ContainerName): Promise<void>

  abstract listObjects(name: ContainerName): Promise<ObjectName[]>
  abstract downloadObject(cName: ContainerName, oName: ObjectName,
                          oOptions: ObjectDataOptions): Promise<ObjectData>

  abstract uploadObject(cName: ContainerName,
                        oName: ObjectName, oData: ObjectData): Promise<void>

  abstract deleteObject(cName: ContainerName, oName: ObjectName): Promise<void>

  /**
   * Generic function used in the next functions
   */
  private async _applyObjects<T> (cName: ContainerName,
                         apply: (oName: string) => Promise<T>): Promise<T[]> {
    const oNames = await this.listObjects(cName)
    return Promise.all(oNames.map(apply))
  }

  /**
   * If downloading to a list of Path, oOptions expect a directory
   */
  async downloadAllObjs (cName: ContainerName,
                         oOptions: ObjectDataOptions): Promise<ObjectData[]> {
    switch (oOptions.kind) {
      case DataKind.Buffer:
        return this._applyObjects(cName, (oName: string) =>
          this.downloadObject(cName, oName, oOptions))
      case DataKind.Path:
        return this._applyObjects(cName, (oName: string) => {
          const oOptionsWithDir = outPathData(path.join(oOptions.output, oName))
          return this.downloadObject(cName, oName, oOptionsWithDir)
        })
    }
  }

  async copyObjects (cNameSrc: ContainerName,
                     cNameDst: ContainerName): Promise<void> {
    await this._applyObjects(cNameSrc, async (oName: string) => {
      const objBufferData =
        await this.downloadObject(cNameSrc, oName, { kind: DataKind.Buffer })
      await this.uploadObject(cNameDst, oName, objBufferData)
    })
  }

  async deleteObjects (cName: ContainerName): Promise<void> {
    await this._applyObjects(cName, oName => this.deleteObject(cName, oName))
  }
}

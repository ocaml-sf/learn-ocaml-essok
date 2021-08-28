export type ContainerName = string
export type ObjectName = string
export type ObjectData = Buffer

export interface CloudService {
  listContainers(): Promise<ContainerName[]>
  createContainer(name: ContainerName): Promise<void>
  deleteContainer(name: ContainerName): Promise<void>

  listObjects(name: ContainerName): Promise<ObjectName[]>
  createObject(cName: ContainerName,
               oName: ObjectName, oPath: ObjectData): Promise<void>
  deleteObject(cName: ContainerName, oName: ObjectName): Promise<void>
}

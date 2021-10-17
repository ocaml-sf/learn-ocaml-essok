import {
  BufferInputData,
  convertData,
  InputData,
  OutputData as DataOptions,
  PathInputData
} from 'utils/Data'

export type ArchiveData = InputData

export type ZipPath = { zipPath: string }

export type BufferFileData = BufferInputData & ZipPath
export type PathFileData = PathInputData & ZipPath

export type FileData = BufferFileData | PathFileData

export interface ArchiveService {
  /**
   * Unzip archive into a list of Buffer or a list of local paths
   * a DataKind.Path options output is a directory
   */
  unzip(archive: ArchiveData,
                 options: DataOptions): Promise<FileData[]>

  /**
   * Zip files into an archive
   * an archive can be a Buffer or a local path
   * a DataKind.Path options is the path to the archive
   */
  zip(files: FileData[], options: DataOptions): Promise<ArchiveData>

  // TODO: implements in parent class
  /**
   *
   */
  zipFromDir(dir: PathFileData, options: DataOptions): Promise<ArchiveData>
}

export function fileData (data: InputData, zipPath: string) : FileData {
  return { ...data, zipPath }
}

export function convertFileData (file: FileData, options: DataOptions)
: FileData {
  return { ...convertData(file, options), zipPath: file.zipPath }
}

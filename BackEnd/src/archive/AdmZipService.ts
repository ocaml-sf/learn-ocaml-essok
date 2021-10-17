import path from 'path'
import AdmZip from 'adm-zip'

import {
  DataKind,
  inBufferData,
  inPathData,
  OutputData as DataOptions
} from 'utils/Data'
import {
  ArchiveData,
  ArchiveService,
  fileData,
  FileData,
  PathFileData
} from './ArchiveService'

export class AdmZipService implements ArchiveService {
  /**
   * for loop is indexed to preserve order in iteration
   */
  unzip (archive: ArchiveData, options: DataOptions): Promise<FileData[]> {
    const zip = new AdmZip(archive.input)

    const files = zip.getEntries().filter(file => !file.isDirectory)
    switch (options.kind) {
      case DataKind.Buffer:
        return Promise.all(files.map(async file =>
          fileData(inBufferData(file.getData()), file.entryName)))
      case DataKind.Path:
        zip.extractAllTo(options.output)
        return Promise.all(files.map(async file => {
          const filePath = path.join(options.output, file.entryName)
          return fileData(inPathData(filePath), file.entryName)
        }))
    }
  }

  async zip (files: FileData[], options: DataOptions): Promise<ArchiveData> {
    const zip = new AdmZip()

    await Promise.all(files.map(async file => {
      switch (file.kind) {
        case DataKind.Buffer:
          return zip.addFile(file.zipPath, file.input)
        case DataKind.Path:
          return zip.addLocalFile(file.input, undefined, file.zipPath)
      }
    }))
    switch (options.kind) {
      case DataKind.Buffer:
        return inBufferData(zip.toBuffer())
      case DataKind.Path:
        zip.writeZip(options.output)
        return inPathData(options.output)
    }
  }

  async zipFromDir (dir: PathFileData,
                    options: DataOptions): Promise<ArchiveData> {
    const zip = new AdmZip()

    zip.addLocalFolder(dir.input, dir.zipPath)
    switch (options.kind) {
      case DataKind.Buffer:
        return inBufferData(zip.toBuffer())
      case DataKind.Path:
        zip.writeZip(options.output)
        return inPathData(options.output)
    }
  }
}

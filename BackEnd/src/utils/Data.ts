import { readFileSync } from 'fs'
import path from 'path'

export type Path = string

export const enum DataKind {
  Buffer,
  Path,
}

export type InputData =
  | { kind: DataKind.Buffer,
      input: Buffer }
  | { kind: DataKind.Path,
      input: Path }

export type OutputData =
  | { kind: DataKind.Buffer }
  | { kind: DataKind.Path,
      output: Path }

export function bufferFromData (iData: InputData): Buffer {
  switch(iData.kind) {
    case DataKind.Buffer:
      return iData.input
    case DataKind.Path:
      return readFileSync(iData.input)
  }
}

/**
 * Append filename to directory path (from a Path kind of InputData)
 */
export function dirToFileInput(dirData: InputData, filename: string) {
  switch(dirData.kind) {
    case DataKind.Buffer:
      return dirData
    case DataKind.Path:
      return {
        ...dirData,
        input: path.join(dirData.input, filename)
      }
  }
}

export function dirToFileOutput(dirData: OutputData, filename: string) {
  switch(dirData.kind) {
    case DataKind.Buffer:
      return dirData
    case DataKind.Path:
      return {
        ...dirData,
        output: path.join(dirData.output, filename)
      }
  }
}

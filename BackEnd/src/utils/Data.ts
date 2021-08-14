import { readFileSync } from 'fs'
import assert from 'assert'

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
  if (iData.kind === DataKind.Buffer) {
    return iData.input
  } else if (iData.kind === DataKind.Path) {
    return readFileSync(iData.input)
  } else {
    assert(false, 'bufferFromData: DataKind')
  }
}

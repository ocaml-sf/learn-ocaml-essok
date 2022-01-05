import fs from 'fs'
import path from 'path'

export type Path = string

export const enum DataKind {
  Buffer,
  Path
}

export type BufferInputData = { kind: DataKind.Buffer, input: Buffer }
export type PathInputData = { kind: DataKind.Path, input: Path }
export type InputData = BufferInputData | PathInputData

export type BufferOutputData = { kind: DataKind.Buffer }
export type PathOutputData = { kind: DataKind.Path, output: Path }
export type OutputData = BufferOutputData | PathOutputData

export function inBufferData (input: Buffer) : BufferInputData {
  return { kind: DataKind.Buffer, input }
}
export function inPathData (input: Path) : PathInputData {
  return { kind: DataKind.Path, input }
}

export const outBufferData: OutputData = { kind: DataKind.Buffer }
export function outPathData (output: Path) : OutputData {
  return { kind: DataKind.Path, output }
}

export function convertData (iData: InputData, oData: OutputData) : InputData {
  switch (iData.kind) {
    case DataKind.Buffer:
      switch (oData.kind) {
        case DataKind.Buffer:
          return iData
        case DataKind.Path:
          fs.mkdirSync(path.dirname(oData.output), { recursive: true })
          fs.writeFileSync(oData.output, iData.input)
          return { kind: DataKind.Path, input: oData.output }
      }
      // break omitted as we are unreachable here (comment for eslint rule)
    case DataKind.Path:
      switch (oData.kind) {
        case DataKind.Buffer:
          return { kind: DataKind.Buffer, input: fs.readFileSync(iData.input) }
        case DataKind.Path:
          if (iData.input !== oData.output) {
            fs.mkdirSync(path.dirname(oData.output), { recursive: true })
            fs.copyFileSync(iData.input, oData.output)
            return { kind: DataKind.Path, input: oData.output }
          } else {
            return iData
          }
      }
  }
}

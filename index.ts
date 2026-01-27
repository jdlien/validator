import Validator, { ValidationEvent } from './src/Validator'

const ValidatorExport = Validator

export type {
  FormControl,
  InputHandler,
  InputHandlers,
  ValidationEventType,
  ValidatorOptions,
} from './src/Validator'
export { ValidationEvent }
export default ValidatorExport

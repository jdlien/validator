import Validator, { ValidationEvent } from './src/Validator'

const ValidatorWithEvent = Validator as typeof Validator & {
  ValidationEvent: typeof ValidationEvent
}

ValidatorWithEvent.ValidationEvent = ValidationEvent

export default ValidatorWithEvent

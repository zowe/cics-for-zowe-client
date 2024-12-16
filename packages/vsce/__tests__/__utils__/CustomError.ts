export default class CustomError extends Error {
  mMessage: String | undefined;
  constructor(message: String) {
    super();
    this.mMessage = message;
  }
}

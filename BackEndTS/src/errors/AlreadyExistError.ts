class AlreadyExistError extends Error {
  constructor(field: string) {
    super();
    this.message = `User with field "${field}" already exist`;
  }
}
export default AlreadyExistError;

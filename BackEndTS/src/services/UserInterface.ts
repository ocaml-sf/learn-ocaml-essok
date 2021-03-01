import { UserDTO } from "../dto";

export interface UserInterface {
  /**
   * Get user from email
   * Return the user if it exists and password check is validated
   * Otherwise return null
   */
  fromLogin(email : string, password : string) : Promise<UserDTO | null>;

  /**
   * Get user from username
   */
  fromUsername(username : string) : Promise<UserDTO | null>;

  /**
   * Create a new user
   * throw an error if user already exist
   */
  makeFromDTO(dto : UserDTO) : Promise<void>;

  /**
   * Enable user from username
   * throw an error if no such user exist
   */
  enableFromUsername(username : string) : Promise<void>;

  /**
   * Disable user from username
   * throw an error if no such user exist
   */
  disableFromUsername(username : string) : Promise<void>

  /**
   * Delete user from username
   * throw an error if no such user exist
   * TODO: delete all servers of that user too
   */
  deleteFromUsername(username : string) : Promise<void>
}

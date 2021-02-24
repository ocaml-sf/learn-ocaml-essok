import UserDTO from "../../dto/UserDTO";

export default interface UserInterface {
  /**
   * Get user from email
   * Return the user if it exists and password check is validated
   * Otherwise return null
   */
  fromDTO(dto : UserDTO) : Promise<UserDTO | null>;

  /**
   * Create a new user
   * throws an error if user already exist
   */
  makeFromDTO(dto: UserDTO) : Promise<void>;
}

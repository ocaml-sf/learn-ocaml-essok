export interface UserListConfig {
  type: string;

  filters: {
    username?: string,
    limit?: number,
    offset?: number
  };
}

export interface UserListConfig {
  type: string;

  filters: {
    username?: string,
    active?: boolean,
    limit?: number,
    offset?: number
  };
}

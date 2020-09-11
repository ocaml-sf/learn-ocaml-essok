export interface UserListConfig {
  type: string;

  filters: {
    username?: string,
    active?: boolean,
    authorized?: boolean,
    limit?: number,
    offset?: number
  };
}

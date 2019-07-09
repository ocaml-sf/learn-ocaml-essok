export interface ServerListConfig {
  type: string;

  filters: {
    author?: string,
    active?: boolean,
    limit?: number,
    offset?: number
  };
}

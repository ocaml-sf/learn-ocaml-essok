export interface ServerListConfig {
  type: string;

  filters: {
    author?: string,
    limit?: number,
    offset?: number
  };
}

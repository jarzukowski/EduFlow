export type PaginatedDTO<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
};

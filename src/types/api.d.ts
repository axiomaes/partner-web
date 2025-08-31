export type Customer = {
  id: string;
  name: string;
  phone: string;
  visits?: number | null;
};

export type Reward = {
  id: string;
  name: string;
  description?: string | null;
  threshold: number;
};

export type NewsItem = {
  id: string;
  title: string;
  body: string;
};

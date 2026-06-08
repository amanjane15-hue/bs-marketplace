export type Listing = {
  id: string;
  title: string;
  price: string;
  category: string;
  custom_category?: string | null;
  condition?: string;
  seller: string;
  university: string;
  posted: string;
  image: string;
  image_urls?: string[];
  goFree?: boolean;
  verified?: boolean;
  user_id?: string;
};

type ListingCardProps = {
  title: string;
  price: string;
  category: string;
  seller: string;
  university: string;
  posted: string;
  image: string;
  badge: string;
};

export default function ListingCard({
  title,
  price,
  category,
  seller,
  university,
  posted,
  image,
  badge,
}: ListingCardProps) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/80 transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-64 w-full overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-sm">
          {badge}
        </span>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
          <span>{category}</span>
          <span>{price}</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">
            {seller} · {university}
          </p>
        </div>
        <p className="text-sm text-slate-500">Posted {posted}</p>
      </div>
    </article>
  );
}

import Link from "next/link";

type Props = {
  categoryCounts: Record<string, number>;
};

export default function CategoriesSection({ categoryCounts }: Props) {
  const categories = [
    {
      title: "Tickets",
      slug: "tickets",
      description: "Find college event passes, sports tickets, concerts, and more.",
    },
    {
      title: "Electronics",
      slug: "electronics",
      description: "Laptops, chargers, and study tech.",
    },
    {
      title: "Textbooks",
      slug: "textbooks",
      description: "Course essentials for every semester.",
    },
    {
      title: "Other",
      slug: "other",
      description: "Everything else for campus life.",
    },
  ];

  return (
    <section className="bg-white py-16" id="categories">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Shop by category
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Find the items that make student life easier.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Explore curated categories designed for campus living, sustainable swaps, and community sharing.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const count = categoryCounts[category.slug] || 0;
            return (
              <Link
                href={`/marketplace?category=${category.slug}`}
                key={category.slug}
                className="group flex flex-col justify-between rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                      {category.title}
                    </p>
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{category.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const categories = [
  { title: "Textbooks", description: "Course essentials for every semester." },
  { title: "Dorm Gear", description: "Cozy furniture and room upgrades." },
  { title: "Electronics", description: "Laptops, chargers, and study tech." },
  { title: "Campus Fashion", description: "Comfortable attire for campus life." },
  { title: "Kitchen Finds", description: "Cookware, dishes, and grocery swaps." },
  { title: "Sports & Fitness", description: "Gear for clubs, workouts, and outdoor fun." },
];

export default function CategoriesSection() {
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

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.title}
              className="group rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                {category.title}
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-950">{category.title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

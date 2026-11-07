import Icon from "@/components/ui/Icon";

export default function SearchForm({ compact = false, className = "", id = "search" }) {
  return (
    <form action="/search" method="get" role="search" className={className}>
      <div className="relative flex items-center">
        <label htmlFor={id} className="sr-only">
          Search MIC TECH
        </label>
        <input
          id={id}
          type="search"
          name="q"
          minLength={2}
          maxLength={100}
          placeholder="Search stories, topics, desks"
          className={
            compact
              ? "input !py-2 pr-10 text-xs"
              : "input !border-line-dark !bg-surface-2/40 !py-2.5 pr-10 text-sm"
          }
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-0 grid h-full w-9 place-items-center text-ivory/55 transition-colors hover:text-ivory"
        >
          <Icon name="search" size={16} />
        </button>
      </div>
    </form>
  );
}

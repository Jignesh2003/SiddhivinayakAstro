import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

export default function ProductFilterSortPanel({
  filters,
  setFilters,
  sortOption,
  setSortOption,
  resetFilters,
  applyFiltersAndSort,
  uniqueCategories,
  uniqueBrands,
  uniqueSizes,
  priceRanges,
  showFilterModal,
  setShowFilterModal,
  showSortModal,
  setShowSortModal,
  isMobile = false,
}) {
  // Filter toggle handler
  const toggleFilter = (type, value) => {
    if (type === "priceRange") {
      setFilters((prev) => ({
        ...prev,
        priceRange: prev.priceRange === value ? "" : value,
      }));
    } else {
      setFilters((prev) => {
        const current = prev[type];
        return {
          ...prev,
          [type]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
      });
    }
  };

  // Desktop sidebar
  if (!isMobile) {
    return (
      <aside className="hidden lg:block w-64 bg-gray-900 border border-gray-800 rounded-md shadow-sm p-4 sticky top-28 max-h-[85vh] overflow-y-auto mr-6">
        <h3 className="font-semibold mb-3 text-white">Sort By</h3>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="w-full border border-gray-700 bg-gray-900 text-white rounded p-2 mb-6 outline-none"
          aria-label="Sort products"
        >
          <option value="">None</option>
          <option value="priceLowHigh">Price: Low to High</option>
          <option value="priceHighLow">Price: High to Low</option>
          <option value="nameAZ">Name: A to Z</option>
          <option value="nameZA">Name: Z to A</option>
        </select>

        <div>
          <h3 className="font-semibold text-white mb-2">Category</h3>
          {uniqueCategories.map((cat) => (
            <label
              key={cat}
              className="block mb-2 cursor-pointer select-none text-gray-300"
            >
              <input
                type="checkbox"
                checked={filters.category.includes(cat)}
                onChange={() => toggleFilter("category", cat)}
                className="mr-2 accent-indigo-500"
              />
              {cat}
            </label>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-white mb-2">Brand</h3>
          {uniqueBrands.map((brand) => (
            <label
              key={brand}
              className="block mb-2 cursor-pointer select-none text-gray-300"
            >
              <input
                type="checkbox"
                checked={filters.brand.includes(brand)}
                onChange={() => toggleFilter("brand", brand)}
                className="mr-2 accent-indigo-500"
              />
              {brand}
            </label>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-white mb-2">Size</h3>
          {uniqueSizes.map((size) => (
            <label
              key={size}
              className="block mb-2 cursor-pointer select-none text-gray-300"
            >
              <input
                type="checkbox"
                checked={filters.size.includes(size)}
                onChange={() => toggleFilter("size", size)}
                className="mr-2 accent-indigo-500"
              />
              {size}
            </label>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-white mb-2">Price Range</h3>
          {priceRanges.map((pr) => (
            <label
              key={pr.value}
              className="block mb-2 cursor-pointer select-none text-gray-300"
            >
              <input
                type="radio"
                name="priceRange"
                checked={filters.priceRange === pr.value}
                onChange={() => toggleFilter("priceRange", pr.value)}
                className="mr-2 accent-indigo-500 appearance-radio"
              />
              {pr.label}
            </label>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={resetFilters}
            className="flex-grow bg-gray-700 rounded-md py-2 hover:bg-gray-600 transition text-gray-50"
          >
            Reset
          </button>
          <button
            onClick={applyFiltersAndSort}
            className="flex-grow bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700 transition"
          >
            Apply
          </button>
        </div>
      </aside>
    );
  }

  // Mobile modals
  return (
    <>
      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 shadow-inner border-t border-gray-800 flex md:hidden z-50">
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold text-white"
          aria-label="Open Filter options"
        >
          <SlidersHorizontal size={16} /> Filter
        </button>
        <button
          onClick={() => setShowSortModal(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold border-l text-white"
          aria-label="Open Sort options"
        >
          <ArrowUpDown size={16} /> Sort
        </button>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end">
          <div className="bg-gray-900 w-3/4 p-4 flex flex-col relative overflow-y-auto max-h-full">
            <button
              onClick={() => setShowFilterModal(false)}
              className="absolute top-2 right-2 text-gray-300 hover:text-white"
              aria-label="Close filter"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Filters</h3>
            <div>
              <h4 className="font-semibold mb-2 text-white">Category</h4>
              {uniqueCategories.map((cat) => (
                <label
                  key={cat}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.category.includes(cat)}
                    onChange={() => toggleFilter("category", cat)}
                    className="mr-2 accent-indigo-500"
                  />
                  {cat}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-white">Brand</h4>
              {uniqueBrands.map((brand) => (
                <label
                  key={brand}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.brand.includes(brand)}
                    onChange={() => toggleFilter("brand", brand)}
                    className="mr-2 accent-indigo-500"
                  />
                  {brand}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-white">Size</h4>
              {uniqueSizes.map((size) => (
                <label
                  key={size}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.size.includes(size)}
                    onChange={() => toggleFilter("size", size)}
                    className="mr-2 accent-indigo-500"
                  />
                  {size}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-white">Price Range</h4>
              {priceRanges.map((pr) => (
                <label
                  key={pr.value}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.priceRange === pr.value}
                    onChange={() => toggleFilter("priceRange", pr.value)}
                    className="mr-2 accent-indigo-500 appearance-radio"
                  />
                  {pr.label}
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={resetFilters}
                className="flex-1 bg-gray-700 rounded-md py-2 hover:bg-gray-600 text-white transition"
              >
                Reset
              </button>
              <button
                onClick={applyFiltersAndSort}
                className="flex-1 bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-2xl shadow-lg p-5 max-h-[50vh] overflow-y-auto relative">
            <button
              onClick={() => setShowSortModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white"
              aria-label="Close sort"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Sort</h3>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 text-white rounded p-2 mb-4 outline-none"
              aria-label="Sort products"
            >
              <option value="">None</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
              <option value="nameAZ">Name: A to Z</option>
              <option value="nameZA">Name: Z to A</option>
            </select>
            <button
              onClick={applyFiltersAndSort}
              className="w-full bg-indigo-700 text-white rounded-md py-2 hover:bg-indigo-800 transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}

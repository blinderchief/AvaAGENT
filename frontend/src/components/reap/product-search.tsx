/**
 * ProductSearch Component
 * 
 * Search and discover products from Reap Protocol marketplace.
 * Supports filtering, sorting, and real-time search.
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Package,
  Tag,
  Star,
  ShoppingCart,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  quantity?: number;
  merchant: {
    id: string;
    name: string;
    verified: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface SearchFilters {
  categories: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  minRating: number;
  tags: string[];
  merchants: string[];
}

export interface ProductSearchProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  loading?: boolean;
  categories?: string[];
  merchants?: Array<{ id: string; name: string }>;
  maxPrice?: number;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

// ============================================================================
// Default Filters
// ============================================================================

const DEFAULT_FILTERS: SearchFilters = {
  categories: [],
  priceRange: [0, 1000],
  inStockOnly: false,
  minRating: 0,
  tags: [],
  merchants: [],
};

// ============================================================================
// Component
// ============================================================================

export function ProductSearch({
  products,
  onAddToCart,
  onProductClick,
  loading = false,
  categories = [],
  merchants = [],
  maxPrice = 1000,
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    priceRange: [0, maxPrice],
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Text search
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    // Price range
    result = result.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // In stock
    if (filters.inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // Rating
    if (filters.minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= filters.minRating);
    }

    // Tags
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.some((t) => p.tags.includes(t))
      );
    }

    // Merchants
    if (filters.merchants.length > 0) {
      result = result.filter((p) => filters.merchants.includes(p.merchant.id));
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        // Assuming newer products have higher IDs
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }

    return result;
  }, [products, debouncedQuery, filters, sortBy]);

  // Get unique tags from products
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [products]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.inStockOnly ||
      filters.minRating > 0 ||
      filters.tags.length > 0 ||
      filters.merchants.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < maxPrice
    );
  }, [filters, maxPrice]);

  const clearFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      priceRange: [0, maxPrice],
    });
  }, [maxPrice]);

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Button (Mobile) */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden relative">
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter products to find exactly what you need
              </SheetDescription>
            </SheetHeader>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              merchants={merchants}
              allTags={allTags}
              maxPrice={maxPrice}
              onClear={clearFilters}
            />
          </SheetContent>
        </Sheet>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {sortBy.includes('desc') ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('relevance')}>
              Relevance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price-asc')}>
              Price: Low to High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price-desc')}>
              Price: High to Low
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('rating')}>
              Rating
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              Newest
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle */}
        <div className="hidden sm:flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1">
              {cat}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleCategory(cat)}
              />
            </Badge>
          ))}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}
          {filters.inStockOnly && (
            <Badge variant="outline" className="gap-1">
              In Stock
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, inStockOnly: false }))
                }
              />
            </Badge>
          )}
          {filters.minRating > 0 && (
            <Badge variant="outline" className="gap-1">
              {filters.minRating}+ Stars
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, minRating: 0 }))
                }
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Desktop Filter Panel */}
        <div className="hidden md:block w-64 shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filters</CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                merchants={merchants}
                allTags={allTags}
                maxPrice={maxPrice}
                onClear={clearFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* Product Grid/List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No products found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search query
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredProducts.length} product{filteredProducts.length !== 1 && 's'} found
              </p>
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                )}
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                      onAddToCart={onAddToCart}
                      onProductClick={onProductClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Panel
// ============================================================================

interface FilterPanelProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  categories: string[];
  merchants: Array<{ id: string; name: string }>;
  allTags: string[];
  maxPrice: number;
  onClear: () => void;
}

function FilterPanel({
  filters,
  setFilters,
  categories,
  merchants,
  allTags,
  maxPrice,
}: FilterPanelProps) {
  return (
    <ScrollArea className="h-[calc(100vh-200px)] md:h-auto pr-4">
      <div className="space-y-6">
        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Categories</h4>
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter((c) => c !== category)
                          : [...prev.categories, category],
                      }))
                    }
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Price Range */}
        <div>
          <h4 className="font-medium mb-3">Price Range</h4>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                priceRange: value as [number, number],
              }))
            }
            max={maxPrice}
            step={1}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <h4 className="font-medium mb-3">Minimum Rating</h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={filters.minRating >= rating ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    minRating: prev.minRating === rating ? 0 : rating,
                  }))
                }
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    filters.minRating >= rating && 'fill-yellow-400 text-yellow-400'
                  )}
                />
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* In Stock */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.inStockOnly}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({
                ...prev,
                inStockOnly: checked as boolean,
              }))
            }
          />
          <span className="text-sm">In Stock Only</span>
        </label>

        {/* Tags */}
        {allTags.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter((t) => t !== tag)
                          : [...prev.tags, tag],
                      }))
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// Product Card
// ============================================================================

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

function ProductCard({
  product,
  viewMode,
  onAddToCart,
  onProductClick,
}: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onProductClick?.(product)}
        >
          <div className="flex gap-4 p-4">
            <div className="w-24 h-24 shrink-0 bg-muted rounded-md flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${product.price.toFixed(2)} {product.currency}
                  </div>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {product.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={product.inStock ? 'outline' : 'secondary'}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Badge>
                {product.merchant.verified && (
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            {onAddToCart && product.inStock && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onProductClick?.(product)}
      >
        <div className="aspect-square bg-muted flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium line-clamp-1">{product.name}</h3>
            {product.rating && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {product.rating.toFixed(1)}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="font-bold">
              ${product.price.toFixed(2)}
            </div>
            {onAddToCart && product.inStock ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            ) : (
              <Badge variant="secondary">Out of Stock</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ProductSearch;

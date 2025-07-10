import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { SortOption, SortOrder } from '@/types/assetHoldings';

interface AssetFiltersControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  categories: string[];
}

const AssetFiltersControls = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  categories
}: AssetFiltersControlsProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-full md:w-48">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="value">Market Value</SelectItem>
          <SelectItem value="pnl">Unrealized P&L</SelectItem>
          <SelectItem value="allocation">Allocation</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        {sortOrder === 'asc' ? (
          <SortAsc className="h-4 w-4" />
        ) : (
          <SortDesc className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default AssetFiltersControls;
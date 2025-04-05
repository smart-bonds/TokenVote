import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProposalFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (searchTerm: string) => void;
  searchTerm: string;
}

const ProposalFilter: React.FC<ProposalFilterProps> = ({
  activeFilter,
  onFilterChange,
  onSearchChange,
  searchTerm,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <FilterButton
          label="All Proposals"
          value="all"
          activeFilter={activeFilter}
          onClick={() => onFilterChange("all")}
        />
        <FilterButton
          label="Active"
          value="active"
          activeFilter={activeFilter}
          onClick={() => onFilterChange("active")}
        />
        <FilterButton
          label="Completed"
          value="completed"
          activeFilter={activeFilter}
          onClick={() => onFilterChange("completed")}
        />
        <FilterButton
          label="My Votes"
          value="my-votes"
          activeFilter={activeFilter}
          onClick={() => onFilterChange("my-votes")}
        />
      </div>
      
      <div className="relative">
        <Input
          type="search"
          placeholder="Search proposals..."
          className="w-full sm:w-64 pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-2.5" />
      </div>
    </div>
  );
};

interface FilterButtonProps {
  label: string;
  value: string;
  activeFilter: string;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  value,
  activeFilter,
  onClick,
}) => {
  const isActive = activeFilter === value;

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      className={`whitespace-nowrap rounded-full ${
        isActive ? "" : "text-foreground"
      }`}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export default ProposalFilter;

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchParams, District } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  initialValues?: SearchParams;
}

export default function SearchForm({ onSearch, initialValues }: SearchFormProps) {
  const { t, language } = useLanguage();
  const [dateFrom, setDateFrom] = useState(initialValues?.dateFrom || "");
  const [dateTo, setDateTo] = useState(initialValues?.dateTo || "");
  const [district, setDistrict] = useState(initialValues?.district || "all");

  // Query to fetch districts
  const { data: districts } = useQuery<District[]>({
    queryKey: ["/api/districts"],
  });

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setDateFrom(initialValues.dateFrom);
      setDateTo(initialValues.dateTo);
      setDistrict(initialValues.district || "all");
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      dateFrom,
      dateTo,
      district: district === "all" ? undefined : district,
    });
  };

  // Group districts by parent area
  const groupedDistricts: Record<string, District[]> = {};
  
  if (districts) {
    districts.forEach(district => {
      if (!groupedDistricts[district.parentArea]) {
        groupedDistricts[district.parentArea] = [];
      }
      groupedDistricts[district.parentArea].push(district);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-0 lg:flex lg:space-x-4">
      {/* Date Range Selection */}
      <div className="lg:w-2/5 space-y-2">
        <Label className="block text-sm font-medium text-gray-700">
          {t("dateRange")}
        </Label>
        <div className="flex space-x-2">
          <div className="w-1/2">
            <div className="relative">
              <Input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-3 pr-10"
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                <Calendar className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="w-1/2">
            <div className="relative">
              <Input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-3 pr-10"
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                <Calendar className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* District Selection */}
      <div className="lg:w-2/5">
        <Label htmlFor="district" className="block text-sm font-medium text-gray-700">
          {t("district")}
        </Label>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder={t("allDistricts")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allDistricts")}</SelectItem>
            
            {Object.keys(groupedDistricts).map((parentArea) => (
              <SelectGroup key={parentArea}>
                <SelectLabel>
                  {language === "ja" ? parentArea : 
                    parentArea === "23区" ? "23 Wards" : 
                    parentArea === "多摩地域" ? "Tama Region" : parentArea}
                </SelectLabel>
                {groupedDistricts[parentArea].map((district) => (
                  <SelectItem key={district.id} value={district.value}>
                    {language === "ja" ? district.nameJa : district.nameEn}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Search Button */}
      <div className="lg:w-1/5 flex items-end">
        <Button 
          type="submit" 
          className="w-full inline-flex justify-center bg-primary hover:bg-indigo-700"
        >
          <Search className="mr-2 h-4 w-4" />
          {t("search")}
        </Button>
      </div>
    </form>
  );
}

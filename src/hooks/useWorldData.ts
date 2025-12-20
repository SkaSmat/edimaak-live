import { useState, useEffect } from "react";
import type { Country, City } from "@/lib/worldData";

/**
 * Custom hook to lazy load world data
 * This reduces initial bundle size by loading country/city data only when needed
 */
export const useWorldData = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lazy load worldData module
    import("@/lib/worldData")
      .then((module) => {
        setCountries(module.WORLD_COUNTRIES);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load world data:", error);
        setIsLoading(false);
      });
  }, []);

  return { countries, isLoading };
};

/**
 * Custom hook to get cities for a specific country with lazy loading
 */
export const useCitiesForCountry = (countryName: string | null) => {
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!countryName) {
      setIsLoading(false);
      return;
    }

    // Lazy load worldData module and get cities for country
    import("@/lib/worldData")
      .then((module) => {
        const countryCities = module.getCitiesForCountry(countryName);
        setCities(countryCities);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load cities:", error);
        setIsLoading(false);
      });
  }, [countryName]);

  return { cities, isLoading };
};

/**
 * Custom hook to get all cities with lazy loading
 */
export const useAllCities = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lazy load worldData module and get all cities
    import("@/lib/worldData")
      .then((module) => {
        const allCities = module.getAllCities();
        setCities(allCities);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load cities:", error);
        setIsLoading(false);
      });
  }, []);

  return { cities, isLoading };
};

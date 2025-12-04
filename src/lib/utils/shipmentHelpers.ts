export const isDateInRange = (
  request: { earliest_date: string | null; latest_date: string | null },
  searchDate: string
): boolean => {
  if (!request.earliest_date || !request.latest_date) return true;

  const selectedDate = new Date(searchDate);
  const earliest = new Date(request.earliest_date);
  const latest = new Date(request.latest_date);

  return selectedDate >= earliest && selectedDate <= latest;
};

export const getDashboardPath = (
  userRole: "sender" | "traveler" | "admin" | null
): string => {
  if (userRole === "sender") return "/dashboard/sender";
  if (userRole === "admin") return "/admin";
  return "/dashboard/traveler";
};

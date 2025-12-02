/**
 * Formate un nom complet en "Prénom I." (première lettre du nom de famille)
 * Ex: "Nadia Ben Ahmed" -> "Nadia B."
 */
export const formatShortName = (fullName: string): string => {
  if (!fullName) return "Anonyme";
  
  const parts = fullName.trim().split(" ");
  
  if (parts.length === 1) {
    return parts[0];
  }
  
  const firstName = parts[0];
  const lastNameInitial = parts[parts.length - 1][0].toUpperCase();
  
  return `${firstName} ${lastNameInitial}.`;
};

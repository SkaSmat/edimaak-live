import defaultVetements from "@/assets/default-vetements.jpg";
import defaultDocuments from "@/assets/default-documents.jpg";
import defaultMedicaments from "@/assets/default-medicaments.jpg";
import defaultElectronique from "@/assets/default-electronique.jpg";
import defaultColis from "@/assets/default-colis.jpg";

/**
 * Retourne l'URL de l'image par défaut en fonction du type d'objet
 */
export const getDefaultImageForItemType = (itemType: string): string => {
  const normalizedType = itemType.toLowerCase().trim();

  // Mapping des types d'objets vers les images par défaut
  if (normalizedType.includes("vêtement") || normalizedType.includes("vetement") || 
      normalizedType.includes("habit") || normalizedType.includes("textile")) {
    return defaultVetements;
  }

  if (normalizedType.includes("document") || normalizedType.includes("papier") || 
      normalizedType.includes("courrier") || normalizedType.includes("lettre")) {
    return defaultDocuments;
  }

  if (normalizedType.includes("médicament") || normalizedType.includes("medicament") || 
      normalizedType.includes("medic") || normalizedType.includes("santé") || 
      normalizedType.includes("sante") || normalizedType.includes("pharmacie")) {
    return defaultMedicaments;
  }

  if (normalizedType.includes("électronique") || normalizedType.includes("electronique") || 
      normalizedType.includes("téléphone") || normalizedType.includes("telephone") || 
      normalizedType.includes("ordinateur") || normalizedType.includes("gadget") ||
      normalizedType.includes("appareil")) {
    return defaultElectronique;
  }

  // Image par défaut pour tous les autres types
  return defaultColis;
};

/**
 * Retourne l'URL de l'image à afficher pour une demande d'expédition
 * Si une image personnalisée est uploadée, elle est prioritaire
 */
export const getShipmentImageUrl = (imageUrl: string | null, itemType: string): string => {
  if (imageUrl) {
    return imageUrl;
  }
  return getDefaultImageForItemType(itemType);
};

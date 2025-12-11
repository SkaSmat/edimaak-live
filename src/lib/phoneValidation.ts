import { PHONE_COUNTRY_CODES } from "./countryData";

// Règles de validation par pays (longueur du numéro SANS indicatif)
const PHONE_RULES: Record<string, { minLength: number; maxLength: number; pattern?: RegExp }> = {
  FR: { minLength: 9, maxLength: 9, pattern: /^[1-9]\d{8}$/ }, // France: 9 chiffres (sans le 0)
  DZ: { minLength: 9, maxLength: 9, pattern: /^[5-7]\d{8}$/ }, // Algérie: 9 chiffres commençant par 5, 6 ou 7
  BE: { minLength: 8, maxLength: 9, pattern: /^[1-9]\d{7,8}$/ }, // Belgique: 8-9 chiffres
  TN: { minLength: 8, maxLength: 8, pattern: /^[2-9]\d{7}$/ }, // Tunisie: 8 chiffres
  MA: { minLength: 9, maxLength: 9, pattern: /^[5-7]\d{8}$/ }, // Maroc: 9 chiffres
  US: { minLength: 10, maxLength: 10, pattern: /^[2-9]\d{9}$/ }, // USA: 10 chiffres
  CA: { minLength: 10, maxLength: 10, pattern: /^[2-9]\d{9}$/ }, // Canada: 10 chiffres
  GB: { minLength: 10, maxLength: 10, pattern: /^[1-9]\d{9}$/ }, // UK: 10 chiffres
  DE: { minLength: 10, maxLength: 11, pattern: /^[1-9]\d{9,10}$/ }, // Allemagne: 10-11 chiffres
  ES: { minLength: 9, maxLength: 9, pattern: /^[6-9]\d{8}$/ }, // Espagne: 9 chiffres
  IT: { minLength: 9, maxLength: 10, pattern: /^[3]\d{8,9}$/ }, // Italie: 9-10 chiffres
  CH: { minLength: 9, maxLength: 9, pattern: /^[1-9]\d{8}$/ }, // Suisse: 9 chiffres
  NL: { minLength: 9, maxLength: 9, pattern: /^[1-9]\d{8}$/ }, // Pays-Bas: 9 chiffres
  PT: { minLength: 9, maxLength: 9, pattern: /^[1-9]\d{8}$/ }, // Portugal: 9 chiffres
};

// Règle par défaut pour les pays non listés
const DEFAULT_RULE: { minLength: number; maxLength: number; pattern?: RegExp } = { minLength: 6, maxLength: 15 };

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  cleanedNumber: string;
}

/**
 * Valide un numéro de téléphone selon le pays sélectionné
 * @param phoneNumber - Le numéro de téléphone (sans indicatif)
 * @param countryId - L'identifiant du pays (ex: "FR", "DZ", "BE")
 * @returns Résultat de validation avec message d'erreur si invalide
 */
export function validatePhoneNumber(phoneNumber: string, countryId: string): PhoneValidationResult {
  // Nettoyer le numéro (enlever espaces, tirets, points)
  let cleaned = phoneNumber.replace(/[\s\-\.()]/g, "");
  
  // Enlever le 0 initial si présent (format local)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Vérifier que le numéro ne contient que des chiffres
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      error: "Le numéro ne doit contenir que des chiffres",
      cleanedNumber: cleaned,
    };
  }

  // Obtenir les règles pour ce pays
  const rules = PHONE_RULES[countryId] || DEFAULT_RULE;
  const country = PHONE_COUNTRY_CODES.find((c) => c.id === countryId);
  const countryName = country?.label.split(" ")[1] || countryId;

  // Vérifier la longueur
  if (cleaned.length < rules.minLength) {
    return {
      isValid: false,
      error: `Numéro trop court pour ${countryName} (min ${rules.minLength} chiffres)`,
      cleanedNumber: cleaned,
    };
  }

  if (cleaned.length > rules.maxLength) {
    return {
      isValid: false,
      error: `Numéro trop long pour ${countryName} (max ${rules.maxLength} chiffres)`,
      cleanedNumber: cleaned,
    };
  }

  // Vérifier le pattern si défini
  if (rules.pattern && !rules.pattern.test(cleaned)) {
    return {
      isValid: false,
      error: `Format de numéro invalide pour ${countryName}`,
      cleanedNumber: cleaned,
    };
  }

  return {
    isValid: true,
    cleanedNumber: cleaned,
  };
}

/**
 * Formate un numéro de téléphone complet avec l'indicatif
 * @param phoneNumber - Le numéro nettoyé (sans indicatif)
 * @param countryId - L'identifiant du pays
 * @returns Le numéro complet avec indicatif (ex: +33612345678)
 */
export function formatFullPhoneNumber(phoneNumber: string, countryId: string): string {
  const country = PHONE_COUNTRY_CODES.find((c) => c.id === countryId);
  const code = country?.code || "+33";
  
  // Nettoyer et enlever le 0 initial
  let cleaned = phoneNumber.replace(/[\s\-\.()]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  return `${code}${cleaned}`;
}

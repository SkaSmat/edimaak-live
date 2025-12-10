// Liste complète des indicatifs téléphoniques avec identifiants uniques
export const PHONE_COUNTRY_CODES = [
  { id: "FR", code: "+33", label: "🇫🇷 France (+33)", searchTerms: "france fr +33" },
  { id: "DZ", code: "+213", label: "🇩🇿 Algérie (+213)", searchTerms: "algerie algeria dz +213" },
  { id: "TN", code: "+216", label: "🇹🇳 Tunisie (+216)", searchTerms: "tunisie tunisia tn +216" },
  { id: "MA", code: "+212", label: "🇲🇦 Maroc (+212)", searchTerms: "maroc morocco ma +212" },
  { id: "BE", code: "+32", label: "🇧🇪 Belgique (+32)", searchTerms: "belgique belgium be +32" },
  { id: "US", code: "+1", label: "🇺🇸 USA (+1)", searchTerms: "usa united states etats unis amerique +1" },
  { id: "CA", code: "+1", label: "🇨🇦 Canada (+1)", searchTerms: "canada ca +1" },
  { id: "GB", code: "+44", label: "🇬🇧 Royaume-Uni (+44)", searchTerms: "royaume uni uk united kingdom angleterre england +44" },
  { id: "DE", code: "+49", label: "🇩🇪 Allemagne (+49)", searchTerms: "allemagne germany de +49" },
  { id: "ES", code: "+34", label: "🇪🇸 Espagne (+34)", searchTerms: "espagne spain es +34" },
  { id: "IT", code: "+39", label: "🇮🇹 Italie (+39)", searchTerms: "italie italy it +39" },
  { id: "CH", code: "+41", label: "🇨🇭 Suisse (+41)", searchTerms: "suisse switzerland ch +41" },
  { id: "NL", code: "+31", label: "🇳🇱 Pays-Bas (+31)", searchTerms: "pays bas netherlands hollande nl +31" },
  { id: "PT", code: "+351", label: "🇵🇹 Portugal (+351)", searchTerms: "portugal pt +351" },
  { id: "PL", code: "+48", label: "🇵🇱 Pologne (+48)", searchTerms: "pologne poland pl +48" },
  { id: "SE", code: "+46", label: "🇸🇪 Suède (+46)", searchTerms: "suede sweden se +46" },
  { id: "NO", code: "+47", label: "🇳🇴 Norvège (+47)", searchTerms: "norvege norway no +47" },
  { id: "DK", code: "+45", label: "🇩🇰 Danemark (+45)", searchTerms: "danemark denmark dk +45" },
  { id: "FI", code: "+358", label: "🇫🇮 Finlande (+358)", searchTerms: "finlande finland fi +358" },
  { id: "AT", code: "+43", label: "🇦🇹 Autriche (+43)", searchTerms: "autriche austria at +43" },
  { id: "IE", code: "+353", label: "🇮🇪 Irlande (+353)", searchTerms: "irlande ireland ie +353" },
  { id: "GR", code: "+30", label: "🇬🇷 Grèce (+30)", searchTerms: "grece greece gr +30" },
  { id: "TR", code: "+90", label: "🇹🇷 Turquie (+90)", searchTerms: "turquie turkey tr +90" },
  { id: "RU", code: "+7", label: "🇷🇺 Russie (+7)", searchTerms: "russie russia ru +7" },
  { id: "UA", code: "+380", label: "🇺🇦 Ukraine (+380)", searchTerms: "ukraine ua +380" },
  { id: "EG", code: "+20", label: "🇪🇬 Égypte (+20)", searchTerms: "egypte egypt eg +20" },
  { id: "SA", code: "+966", label: "🇸🇦 Arabie Saoudite (+966)", searchTerms: "arabie saoudite saudi arabia sa +966" },
  { id: "AE", code: "+971", label: "🇦🇪 Émirats Arabes Unis (+971)", searchTerms: "emirats arabes unis uae dubai +971" },
  { id: "QA", code: "+974", label: "🇶🇦 Qatar (+974)", searchTerms: "qatar qa +974" },
  { id: "KW", code: "+965", label: "🇰🇼 Koweït (+965)", searchTerms: "koweit kuwait kw +965" },
  { id: "LB", code: "+961", label: "🇱🇧 Liban (+961)", searchTerms: "liban lebanon lb +961" },
  { id: "JO", code: "+962", label: "🇯🇴 Jordanie (+962)", searchTerms: "jordanie jordan jo +962" },
  { id: "CN", code: "+86", label: "🇨🇳 Chine (+86)", searchTerms: "chine china cn +86" },
  { id: "JP", code: "+81", label: "🇯🇵 Japon (+81)", searchTerms: "japon japan jp +81" },
  { id: "KR", code: "+82", label: "🇰🇷 Corée du Sud (+82)", searchTerms: "coree du sud south korea kr +82" },
  { id: "IN", code: "+91", label: "🇮🇳 Inde (+91)", searchTerms: "inde india in +91" },
  { id: "AU", code: "+61", label: "🇦🇺 Australie (+61)", searchTerms: "australie australia au +61" },
  { id: "BR", code: "+55", label: "🇧🇷 Brésil (+55)", searchTerms: "bresil brazil br +55" },
  { id: "MX", code: "+52", label: "🇲🇽 Mexique (+52)", searchTerms: "mexique mexico mx +52" },
  { id: "AR", code: "+54", label: "🇦🇷 Argentine (+54)", searchTerms: "argentine argentina ar +54" },
  { id: "ZA", code: "+27", label: "🇿🇦 Afrique du Sud (+27)", searchTerms: "afrique du sud south africa za +27" },
  { id: "NG", code: "+234", label: "🇳🇬 Nigeria (+234)", searchTerms: "nigeria ng +234" },
  { id: "KE", code: "+254", label: "🇰🇪 Kenya (+254)", searchTerms: "kenya ke +254" },
  { id: "CI", code: "+225", label: "🇨🇮 Côte d'Ivoire (+225)", searchTerms: "cote d ivoire ivory coast ci +225" },
  { id: "SN", code: "+221", label: "🇸🇳 Sénégal (+221)", searchTerms: "senegal sn +221" },
  { id: "CM", code: "+237", label: "🇨🇲 Cameroun (+237)", searchTerms: "cameroun cameroon cm +237" },
  { id: "ML", code: "+223", label: "🇲🇱 Mali (+223)", searchTerms: "mali ml +223" },
];

// Liste des pays pour le pays de résidence
export const COUNTRIES = [
  { value: "France", label: "🇫🇷 France", searchTerms: "france fr" },
  { value: "Algérie", label: "🇩🇿 Algérie", searchTerms: "algerie algeria dz" },
  { value: "Tunisie", label: "🇹🇳 Tunisie", searchTerms: "tunisie tunisia tn" },
  { value: "Maroc", label: "🇲🇦 Maroc", searchTerms: "maroc morocco ma" },
  { value: "Belgique", label: "🇧🇪 Belgique", searchTerms: "belgique belgium be" },
  { value: "États-Unis", label: "🇺🇸 États-Unis", searchTerms: "etats unis usa united states" },
  { value: "Canada", label: "🇨🇦 Canada", searchTerms: "canada ca" },
  { value: "Royaume-Uni", label: "🇬🇧 Royaume-Uni", searchTerms: "royaume uni uk united kingdom angleterre" },
  { value: "Allemagne", label: "🇩🇪 Allemagne", searchTerms: "allemagne germany de" },
  { value: "Espagne", label: "🇪🇸 Espagne", searchTerms: "espagne spain es" },
  { value: "Italie", label: "🇮🇹 Italie", searchTerms: "italie italy it" },
  { value: "Suisse", label: "🇨🇭 Suisse", searchTerms: "suisse switzerland ch" },
  { value: "Pays-Bas", label: "🇳🇱 Pays-Bas", searchTerms: "pays bas netherlands hollande" },
  { value: "Portugal", label: "🇵🇹 Portugal", searchTerms: "portugal pt" },
  { value: "Pologne", label: "🇵🇱 Pologne", searchTerms: "pologne poland pl" },
  { value: "Suède", label: "🇸🇪 Suède", searchTerms: "suede sweden se" },
  { value: "Norvège", label: "🇳🇴 Norvège", searchTerms: "norvege norway no" },
  { value: "Danemark", label: "🇩🇰 Danemark", searchTerms: "danemark denmark dk" },
  { value: "Finlande", label: "🇫🇮 Finlande", searchTerms: "finlande finland fi" },
  { value: "Autriche", label: "🇦🇹 Autriche", searchTerms: "autriche austria at" },
  { value: "Irlande", label: "🇮🇪 Irlande", searchTerms: "irlande ireland ie" },
  { value: "Grèce", label: "🇬🇷 Grèce", searchTerms: "grece greece gr" },
  { value: "Turquie", label: "🇹🇷 Turquie", searchTerms: "turquie turkey tr" },
  { value: "Russie", label: "🇷🇺 Russie", searchTerms: "russie russia ru" },
  { value: "Ukraine", label: "🇺🇦 Ukraine", searchTerms: "ukraine ua" },
  { value: "Égypte", label: "🇪🇬 Égypte", searchTerms: "egypte egypt eg" },
  { value: "Arabie Saoudite", label: "🇸🇦 Arabie Saoudite", searchTerms: "arabie saoudite saudi arabia" },
  { value: "Émirats Arabes Unis", label: "🇦🇪 Émirats Arabes Unis", searchTerms: "emirats arabes unis uae dubai" },
  { value: "Qatar", label: "🇶🇦 Qatar", searchTerms: "qatar qa" },
  { value: "Koweït", label: "🇰🇼 Koweït", searchTerms: "koweit kuwait kw" },
  { value: "Liban", label: "🇱🇧 Liban", searchTerms: "liban lebanon lb" },
  { value: "Jordanie", label: "🇯🇴 Jordanie", searchTerms: "jordanie jordan jo" },
  { value: "Chine", label: "🇨🇳 Chine", searchTerms: "chine china cn" },
  { value: "Japon", label: "🇯🇵 Japon", searchTerms: "japon japan jp" },
  { value: "Corée du Sud", label: "🇰🇷 Corée du Sud", searchTerms: "coree du sud south korea" },
  { value: "Inde", label: "🇮🇳 Inde", searchTerms: "inde india in" },
  { value: "Australie", label: "🇦🇺 Australie", searchTerms: "australie australia au" },
  { value: "Brésil", label: "🇧🇷 Brésil", searchTerms: "bresil brazil br" },
  { value: "Mexique", label: "🇲🇽 Mexique", searchTerms: "mexique mexico mx" },
  { value: "Argentine", label: "🇦🇷 Argentine", searchTerms: "argentine argentina ar" },
  { value: "Afrique du Sud", label: "🇿🇦 Afrique du Sud", searchTerms: "afrique du sud south africa" },
  { value: "Nigeria", label: "🇳🇬 Nigeria", searchTerms: "nigeria ng" },
  { value: "Kenya", label: "🇰🇪 Kenya", searchTerms: "kenya ke" },
  { value: "Côte d'Ivoire", label: "🇨🇮 Côte d'Ivoire", searchTerms: "cote d ivoire ivory coast" },
  { value: "Sénégal", label: "🇸🇳 Sénégal", searchTerms: "senegal sn" },
  { value: "Cameroun", label: "🇨🇲 Cameroun", searchTerms: "cameroun cameroon cm" },
  { value: "Mali", label: "🇲🇱 Mali", searchTerms: "mali ml" },
];

// Options formatées pour SearchableSelect - utilise l'id unique comme valeur
export const getPhoneCodeOptions = () =>
  PHONE_COUNTRY_CODES.map((c) => ({
    value: c.id, // Utilise l'id unique (FR, DZ, US, CA...) comme valeur
    label: c.label,
    searchTerms: c.searchTerms,
  }));

// Récupère le code téléphonique à partir de l'id du pays
export const getPhoneCodeById = (id: string): string => {
  const country = PHONE_COUNTRY_CODES.find((c) => c.id === id);
  return country?.code || "+33";
};

// Trouve le pays correspondant à un numéro de téléphone (pour le chargement)
export const findCountryByPhone = (phone: string): { id: string; code: string } | null => {
  // Trie par longueur de code décroissante pour matcher les codes les plus longs d'abord
  const sorted = [...PHONE_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  const found = sorted.find((c) => phone.startsWith(c.code));
  return found ? { id: found.id, code: found.code } : null;
};

export const getCountryOptions = () =>
  COUNTRIES.map((c) => ({
    value: c.value,
    label: c.label,
    searchTerms: c.searchTerms,
  }));

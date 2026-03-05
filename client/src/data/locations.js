export const INDIA_LOCATIONS = {
  Gujarat: {
    Ahmedabad: ["Ahmedabad City", "Daskroi", "Sanand", "Bavla", "Dholka"],
    Amreli: ["Amreli", "Bagasara", "Dhari", "Khambha", "Lathi", "Savarkundla"],
    Anand: ["Anand", "Borsad", "Khambhat", "Petlad"],
    Morbi: ["Morbi", "Halvad", "Maliya", "Tankara", "Wankaner"],
    Rajkot: ["Rajkot", "Gondal", "Jasdan", "Jetpur", "Kotda Sangani", "Upleta"],
    Surat: ["Surat City", "Bardoli", "Choryasi", "Kamrej", "Mandvi", "Olpad"],
    Vadodara: [
      "Vadodara City",
      "Dabhoi",
      "Karjan",
      "Padra",
      "Savli",
      "Vaghodia",
    ],
  },
  Maharashtra: {
    Mumbai: ["Mumbai City", "Mumbai Suburban"],
    Pune: ["Pune City", "Haveli", "Mulshi", "Maval", "Bhor"],
    Nashik: ["Nashik City", "Igatpuri", "Dindori", "Peth", "Sinnar"],
    Nagpur: ["Nagpur City", "Nagpur Rural", "Kamptee", "Hingna"],
  },
  Punjab: {
    Amritsar: ["Amritsar-I", "Amritsar-II", "Ajnala", "Majitha"],
    Ludhiana: ["Ludhiana-I", "Ludhiana-II", "Jagraon", "Raikot"],
    Jalandhar: ["Jalandhar-I", "Jalandhar-II", "Nakodar", "Phillaur"],
    Patiala: ["Patiala", "Nabha", "Rajpura", "Samana"],
  },
  Rajasthan: {
    Jaipur: ["Jaipur City", "Amber", "Bassi", "Chaksu", "Jamwa Ramgarh"],
    Jodhpur: ["Jodhpur City", "Bilara", "Osian", "Shergarh"],
    Udaipur: ["Udaipur City", "Girwa", "Mavli", "Vallabhnagar"],
    Ajmer: ["Ajmer City", "Beawar", "Kishangarh", "Nasirabad"],
  },
  Karnataka: {
    Bangalore: [
      "Bangalore North",
      "Bangalore South",
      "Bangalore East",
      "Anekal",
    ],
    Mysore: ["Mysore City", "Hunsur", "K.R. Nagara", "Nanjangud"],
    Mangalore: ["Mangalore City", "Bantwal", "Belthangady", "Puttur"],
  },
  "Tamil Nadu": {
    Chennai: ["Chennai North", "Chennai South", "Alandur", "Tambaram"],
    Coimbatore: [
      "Coimbatore North",
      "Coimbatore South",
      "Pollachi",
      "Valparai",
    ],
    Madurai: ["Madurai North", "Madurai South", "Melur", "Vadipatti"],
  },
  Delhi: {
    "Central Delhi": ["Connaught Place", "Karol Bagh", "Paharganj"],
    "North Delhi": ["Civil Lines", "Model Town", "Sadar Bazar"],
    "South Delhi": ["Defence Colony", "Hauz Khas", "Kalkaji"],
  },
};

export const getStates = () => Object.keys(INDIA_LOCATIONS);

export const getDistricts = (state) => {
  if (!state || !INDIA_LOCATIONS[state]) return [];
  return Object.keys(INDIA_LOCATIONS[state]);
};

export const getTalukas = (state, district) => {
  if (
    !state ||
    !district ||
    !INDIA_LOCATIONS[state] ||
    !INDIA_LOCATIONS[state][district]
  )
    return [];
  return INDIA_LOCATIONS[state][district];
};

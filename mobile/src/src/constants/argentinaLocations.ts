// Constants for Argentina locations (provinces, cities, neighborhoods)

export const ARGENTINA_PROVINCES = [
  { id: 'caba', name: 'Ciudad Autónoma de Buenos Aires', abbr: 'CABA' },
  { id: 'buenos-aires', name: 'Buenos Aires', abbr: 'BA' },
  { id: 'cordoba', name: 'Córdoba', abbr: 'CB' },
  { id: 'santa-fe', name: 'Santa Fe', abbr: 'SF' },
  { id: 'mendoza', name: 'Mendoza', abbr: 'MZ' },
  { id: 'tucuman', name: 'Tucumán', abbr: 'TM' },
  { id: 'entre-rios', name: 'Entre Ríos', abbr: 'ER' },
  { id: 'salta', name: 'Salta', abbr: 'SA' },
  { id: 'misiones', name: 'Misiones', abbr: 'MI' },
  { id: 'chaco', name: 'Chaco', abbr: 'CH' },
  { id: 'corrientes', name: 'Corrientes', abbr: 'CR' },
  { id: 'neuquen', name: 'Neuquén', abbr: 'NQ' },
  { id: 'rio-negro', name: 'Río Negro', abbr: 'RN' },
  { id: 'formosa', name: 'Formosa', abbr: 'FO' },
  { id: 'chubut', name: 'Chubut', abbr: 'CH' },
  { id: 'san-juan', name: 'San Juan', abbr: 'SJ' },
  { id: 'san-luis', name: 'San Luis', abbr: 'SL' },
  { id: 'la-pampa', name: 'La Pampa', abbr: 'LP' },
  { id: 'santiago-del-estero', name: 'Santiago del Estero', abbr: 'SE' },
  { id: 'catamarca', name: 'Catamarca', abbr: 'CT' },
  { id: 'la-rioja', name: 'La Rioja', abbr: 'LR' },
  { id: 'jujuy', name: 'Jujuy', abbr: 'JY' },
  { id: 'santa-cruz', name: 'Santa Cruz', abbr: 'SC' },
  { id: 'tierra-del-fuego', name: 'Tierra del Fuego', abbr: 'TF' },
] as const;

export const CABA_NEIGHBORHOODS = [
  'Palermo', 'Belgrano', 'Recoleta', 'San Telmo', 'La Boca', 'Puerto Madero',
  'Retiro', 'San Nicolás', 'Monserrat', 'Balvanera', 'Almagro', 'Caballito',
  'Villa Crespo', 'Chacarita', 'Villa Urquiza', 'Coghlan', 'Saavedra',
  'Villa Pueyrredón', 'Villa Devoto', 'Villa del Parque', 'Villa Santa Rita',
  'Villa General Mitre', 'Villa Soldati', 'Villa Lugano', 'Nueva Pompeya',
  'Barracas', 'Parque Patricios', 'Constitución', 'Mataderos', 'Liniers',
  'Flores', 'Floresta', 'Vélez Sarsfield', 'Versailles', 'Villa Luro',
  'Parque Avellaneda', 'Villa Real', 'Villa Riachuelo', 'Villa Domínico'
] as const;

export const BUENOS_AIRES_CITIES = [
  'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Azul', 'Olavarría',
  'Junín', 'Pergamino', 'San Antonio de Areco', 'San Pedro', 'Baradero',
  'Zárate', 'Campana', 'Tigre', 'San Fernando', 'San Isidro', 'Vicente López',
  'San Martín', 'Tres de Febrero', 'Hurlingham', 'Ituzaingó', 'Morón',
  'La Matanza', 'Merlo', 'Moreno', 'San Miguel', 'José C. Paz', 'Malvinas Argentinas',
  'Villa Sarmiento', 'San Vicente', 'Cañuelas', 'Ezeiza', 'Esteban Echeverría',
  'Lomas de Zamora', 'Lanús', 'Avellaneda', 'Quilmes', 'Berazategui', 'Florencio Varela',
  'Almirante Brown', 'Coronel Suárez', 'Pehuajó', 'Carlos Casares', 'Bolívar',
  'Chascomús', 'Lezama', 'Ranchos', 'General Belgrano', 'Tandil', 'Benito Juárez',
  'Necochea', 'Quequén', 'Lobería', 'Balcarce', 'Ayacucho', 'Tandil'
] as const;

export const CORDOBA_CITIES = [
  'Córdoba', 'Villa María', 'Río Cuarto', 'San Francisco', 'Alta Gracia',
  'Jesús María', 'Colonia Caroya', 'Cosquín', 'La Falda', 'Carlos Paz',
  'Mina Clavero', 'Villa Dolores', 'Bell Ville', 'Canals', 'Leones',
  'Río Segundo', 'Villa Allende', 'Unquillo', 'Mendiolaza', 'Saldán',
  'Malagueño', 'Santa Rosa de Calamuchita', 'Embalse', 'Villa Giardino',
  'La Cumbre', 'Capilla del Monte', 'Cruz del Eje', 'Dean Funes', 'San Antonio',
  'Arias', 'Buchardo', 'Calamuchita', 'General Levalle', 'Juárez Celman',
  'Marcos Juárez', 'Presidente Roque Sáenz Peña', 'Río Primero', 'Río Seco',
  'San Alberto', 'San Javier', 'Santa María', 'Sobremonte', 'Tercero Arriba',
  'Totoral', 'Tulumba', 'Uncatin'
] as const;

export const SANTA_FE_CITIES = [
  'Santa Fe', 'Rosario', 'Venado Tuerto', 'Rafaela', 'Reconquista',
  'Santo Tomé', 'Villa Constitución', 'San Lorenzo', 'Esperanza', 'Fray Luis Beltrán',
  'Funes', 'Pérez', 'Granadero Baigorria', 'Capitán Bermúdez', 'San Javier',
  'Cayastá', 'Helvecia', 'San Justo', 'Ceres', 'Tostado', 'Vera',
  'Álvear', 'Angel Gallardo', 'Arroyo Seco', 'Atamisqui', 'Bella Vista',
  'Berkeley', 'Bernardo de Irigoyen', 'Bouquet', 'Cándido Pujato', 'Cañada de Gómez',
  'Carlos Pellegrini', 'Casilda', 'Cayastá', 'Chabás', 'Colonia Aldao',
  'Colonia Bigand', 'Colonia Candelaria', 'Colonia Caroya', 'Colonia Dolores',
  'Colonia Elisa', 'Colonia Iturraspe', 'Colonia Jauregui', 'Colonia Margarita',
  'Colonia San José', 'Colonia San Pedro', 'Coronda', 'Cortada', 'Desvío Arijón',
  'El Arazá', 'Elortondo', 'Empedrado', 'Esperanza', 'Estación Alvear',
  'Fighiera', 'Firmat', 'Frontera', 'Garupá', 'Gálvez', 'Gato Colorado',
  'Gobernador Crespo', 'Gálvez', 'Humberto 1º', 'Humboldt', 'Ibarlucea',
  'Iriondo', 'Jacinto L. Aráuz', 'Laguna Paiva', 'Las Banderas', 'Las Parejas',
  'Las Rosas', 'Llambí Campbell', 'Los Cardos', 'Los Molinos', 'Los Naranjos',
  'Luna', 'Máximo Paz', 'Mariano Moreno', 'Matilde', 'Margarita', 'Melincué',
  'Mojón Grande', 'Monigotes', 'Monte Vera', 'Murphy', 'Nueve de Julio',
  'Obligado', 'Palacios', 'Paraje El Diez', 'Pavón', 'Pavón Arriba',
  'Pedro Gómez Cello', 'Piamonte', 'Pilar', 'Pinto', 'Portugalete',
  'Pueblo Esther', 'Pueblo Irigoyen', 'Pueblo Muñoz', 'Pueblo San José',
  'Puerto Gaboto', 'Puerto San Martín', 'Pujato', 'Racedo', 'Recreo',
  'Ricardone', 'Roldán', 'Saladero', 'San Antonio de Areco', 'San Carlos Centro',
  'San Cristóbal', 'San Eduardo', 'San Eugenio', 'San Fidel', 'San Gregorio',
  'San Javier', 'San Jerónimo Norte', 'San Jerónimo Sud', 'San Jorge',
  'San José de la Esquina', 'San José del Rincón', 'San Justo', 'San Lorenzo',
  'San Mariano', 'San Martín de las Andes', 'San Martín Norte', 'San Pedro',
  'San Vicente', 'Santa Clara de Buena Vista', 'Santa Clara del Mar',
  'Santa Fe', 'Santo Tomé', 'Sauce Viejo', 'Sauce Viejo Norte', 'Sauceda',
  'Saugasta', 'Serodino', 'Sunchales', 'Susana', 'Tavernier', 'Taylor',
  'Timbúes', 'Tobuna', 'Tostado', 'Tres de Enero', 'Trigal', 'Uranga',
  'Vera', 'Villa Ana', 'Villa Amelia', 'Villa Cañás', 'Villa Constitución',
  'Villa del Rosario', 'Villa Diego', 'Villa Epequia', 'Villa Gdor. Galvez',
  'Villa Guillermina', 'Villa Minetti', 'Villa Mugueta', 'Villa Ocampo',
  'Villa San Antonio', 'Villa San José', 'Villa San José Norte', 'Villa Trinidad',
  'Virginia', 'Yapeyú', 'Zavalla', 'Zavalla Norte'
] as const;

export const MENDOZA_CITIES = [
  'Mendoza', 'Godoy Cruz', 'Las Heras', 'San Martín', 'Maipú', 'Luján de Cuyo',
  'Guaymallén', 'San Rafael', 'Malargüe', 'San Carlos', 'Tunuyán', 'Tupungato',
  'General Alvear', 'Rivadavia', 'Santa Rosa', 'La Paz', 'Junín', 'Gral. Alvear',
  'San Martín', 'San Rafael', 'Malargüe', 'San Carlos', 'Tunuyán', 'Tupungato'
] as const;

// Location validation patterns
export const LOCATION_PATTERNS = {
  postalCode: /^[A-Z]\d{4}[A-Z]{3}$/, // Argentina postal code format
  phone: /^(?:(?:\+|00)54)?(?:11|[2368]\d)(?:(?:\d|\d{2})\d{2})\d{6}$/, // Argentina phone format
  coordinates: {
    latitude: /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}$/,
    longitude: /^-?([1]?[1-7][1-9]|[1-9]?[1-9])\.{1}\d{1,6}$/
  }
} as const;

// Helper functions for location validation
export const isValidProvince = (province: string): boolean => {
  return ARGENTINA_PROVINCES.some(p => 
    p.name.toLowerCase() === province.toLowerCase() || 
    p.abbr.toLowerCase() === province.toLowerCase()
  );
};

export const isValidCABANeighborhood = (neighborhood: string): boolean => {
  return CABA_NEIGHBORHOODS.some(n => 
    n.toLowerCase() === neighborhood.toLowerCase()
  );
};

export const getProvinceInfo = (provinceId: string | undefined) => {
  return ARGENTINA_PROVINCES.find(p => p.id === provinceId);
};

export const getProvinceCities = (provinceId: string): string[] => {
  switch (provinceId) {
    case 'caba':
      return ['Ciudad Autónoma de Buenos Aires'];
    case 'buenos-aires':
      return [...BUENOS_AIRES_CITIES];
    case 'cordoba':
      return [...CORDOBA_CITIES];
    case 'santa-fe':
      return [...SANTA_FE_CITIES];
    case 'mendoza':
      return [...MENDOZA_CITIES];
    default:
      return [];
  }
};

export const getCABANeighborhoods = (): string[] => {
  return [...CABA_NEIGHBORHOODS];
};

// Location formatting utilities
export const formatAddress = (address: {
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city: string;
  province: string;
  country?: string;
}): string => {
  const parts = [];
  
  if (address.street) {
    parts.push(address.street);
    if (address.streetNumber) {
      parts.push(address.streetNumber);
    }
  }
  
  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }
  
  parts.push(address.city);
  parts.push(address.province);
  
  if (address.country && address.country !== 'Argentina') {
    parts.push(address.country);
  }
  
  return parts.join(', ');
};

export const parseAddress = (fullAddress: string): {
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  province?: string;
  country?: string;
} => {
  const result: any = {};
  
  // Try to extract province
  for (const province of ARGENTINA_PROVINCES) {
    if (fullAddress.toLowerCase().includes(province.name.toLowerCase()) ||
        fullAddress.toLowerCase().includes(province.abbr.toLowerCase())) {
      result.province = province.name;
      break;
    }
  }
  
  // Try to extract CABA neighborhood
  if (result.province === 'Ciudad Autónoma de Buenos Aires') {
    for (const neighborhood of CABA_NEIGHBORHOODS) {
      if (fullAddress.toLowerCase().includes(neighborhood.toLowerCase())) {
        result.neighborhood = neighborhood;
        break;
      }
    }
  }
  
  // Extract street and number (basic pattern)
  const streetPattern = /([A-Za-záéíóúñÁÉÍÓÚÑ\s]+)\s+(\d+)/;
  const streetMatch = fullAddress.match(streetPattern);
  if (streetMatch) {
    result.street = streetMatch[1].trim();
    result.streetNumber = streetMatch[2];
  }
  
  return result;
};

// Default coordinates for major Argentine cities
export const DEFAULT_COORDINATES = {
  'caba': { latitude: -34.6037, longitude: -58.3816 },
  'la-plata': { latitude: -34.9215, longitude: -57.9547 },
  'mar-del-plata': { latitude: -38.0020, longitude: -57.5575 },
  'bahia-blanca': { latitude: -38.7196, longitude: -62.2724 },
  'cordoba': { latitude: -31.4201, longitude: -64.1888 },
  'rosario': { latitude: -32.9442, longitude: -60.6393 },
  'santa-fe': { latitude: -31.6333, longitude: -60.7000 },
  'mendoza': { latitude: -32.8908, longitude: -68.8458 },
  'tucuman': { latitude: -26.8241, longitude: -65.2226 },
  'salta': { latitude: -24.7889, longitude: -65.4104 },
} as const;

export default {
  ARGENTINA_PROVINCES,
  CABA_NEIGHBORHOODS,
  BUENOS_AIRES_CITIES,
  CORDOBA_CITIES,
  SANTA_FE_CITIES,
  MENDOZA_CITIES,
  LOCATION_PATTERNS,
  isValidProvince,
  isValidCABANeighborhood,
  getProvinceInfo,
  getProvinceCities,
  getCABANeighborhoods,
  formatAddress,
  parseAddress,
  DEFAULT_COORDINATES,
};

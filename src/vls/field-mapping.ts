/**
 * VLS Homes Field Mapping
 *
 * Maps MLS listing fields to VLS Homes form fields
 */

import type { MLSListing } from '../mls/types';

/**
 * VLS Homes classification types
 */
export const VLS_CLASSIFICATION = {
  HOUSE: 'RES',        // Residential / House
  CONDO: 'CON',        // Condominium
  COOP: 'COP',         // Co-op / Cooperative
  LAND: 'LAN',         // Land / Lot
  COMMERCIAL: 'COM',   // Commercial
  RENTAL: 'REN',       // Rental Apartment
} as const;

/**
 * Map MLS property type to VLS classification
 */
export function mapPropertyType(propertyType: string): string {
  const typeMap: Record<string, string> = {
    // Single Family / House
    'Single Family': VLS_CLASSIFICATION.HOUSE,
    'Single Family Residence': VLS_CLASSIFICATION.HOUSE,
    'House': VLS_CLASSIFICATION.HOUSE,
    'Detached': VLS_CLASSIFICATION.HOUSE,
    'Residential': VLS_CLASSIFICATION.HOUSE,
    'SFR': VLS_CLASSIFICATION.HOUSE,

    // Condo
    'Condo': VLS_CLASSIFICATION.CONDO,
    'Condominium': VLS_CLASSIFICATION.CONDO,
    'Condo/Co-op': VLS_CLASSIFICATION.CONDO,

    // Co-op
    'Co-op': VLS_CLASSIFICATION.COOP,
    'Cooperative': VLS_CLASSIFICATION.COOP,

    // Townhouse (map to condo for VLS)
    'Townhouse': VLS_CLASSIFICATION.CONDO,
    'Townhome': VLS_CLASSIFICATION.CONDO,
    'Attached': VLS_CLASSIFICATION.CONDO,

    // Land
    'Land': VLS_CLASSIFICATION.LAND,
    'Lot': VLS_CLASSIFICATION.LAND,
    'Lots/Land': VLS_CLASSIFICATION.LAND,
    'Vacant Land': VLS_CLASSIFICATION.LAND,

    // Commercial
    'Commercial': VLS_CLASSIFICATION.COMMERCIAL,
    'Commercial/Industrial': VLS_CLASSIFICATION.COMMERCIAL,
    'Business': VLS_CLASSIFICATION.COMMERCIAL,
    'Retail': VLS_CLASSIFICATION.COMMERCIAL,
    'Office': VLS_CLASSIFICATION.COMMERCIAL,

    // Rental
    'Rental': VLS_CLASSIFICATION.RENTAL,
    'Apartment': VLS_CLASSIFICATION.RENTAL,
    'Multi-Family': VLS_CLASSIFICATION.RENTAL,
    'Duplex': VLS_CLASSIFICATION.RENTAL,
    'Triplex': VLS_CLASSIFICATION.RENTAL,
  };

  const normalized = propertyType.trim();
  return typeMap[normalized] || VLS_CLASSIFICATION.HOUSE;
}

/**
 * VLS Homes Step 1 form fields (Basic Info)
 */
export interface VLSStep1Fields {
  classification: string;      // Radio: RES, CON, COP, LAN, COM, REN
  listing_type: string;        // Dropdown: type of listing
  for_sale: boolean;           // Checkbox
  for_rent: boolean;           // Checkbox
  street_num: string;          // Text: street number
  street_name: string;         // Text: street name
  street_type: string;         // Text: Rd, St, Ave, etc.
  zip: string;                 // Text: required
  country: string;             // Dropdown: default "United States"
  address_display: string;     // Dropdown: Full Address on Public Sites
  categories: string[];        // Checkboxes: Short Sale, REO, etc.
}

/**
 * VLS Homes Step 2 form fields (Property Details)
 */
export interface VLSStep2Fields {
  sale_price: number;          // Text: lp
  town: string;                // Dropdown: auto-filled from zip
  area: string;                // Text
  school_district: string;     // Text
  bathrooms_full: number;      // Dropdown: fbaths (0-10)
  bathrooms_half: number;      // Dropdown: hbaths (0-5)
  style: string;               // Dropdown
  beds: number;                // Dropdown: beds (0-20+)
  condition: string;           // Dropdown
  rooms: number;               // Dropdown
  construct: string;           // Dropdown
  families: number;            // Dropdown (1-4)
  kitchens: number;            // Dropdown (1-4)
  sqft: number;                // Text
  drive: string;               // Dropdown
  stories: number;             // Dropdown
  lot_size: string;            // Text
  basement: string;            // Dropdown
  acreage: string;             // Text
  patio: string;               // Dropdown
  taxes: number;               // Text
  porch: string;               // Dropdown
  year_built: number;          // Text
  age: number;                 // Text (alternative to year_built)
  description: string;         // Textarea: remarks
  co_listor: string;           // Dropdown

  // Options checkboxes
  den: boolean;
  eik: boolean;                // Eat-in Kitchen
  tennis: boolean;
  attic: boolean;
  dining: boolean;
  fireplace: number;           // Dropdown (0-5)
  waterview: boolean;
  office: boolean;
  carpet: boolean;
  garage_num: number;          // Dropdown
  garage_type: string;         // Dropdown
  waterfront: boolean;
  fin_bsmt: boolean;           // Finished Basement
  pool_type: string;           // Dropdown
  water_type: string;          // Dropdown
}

/**
 * Map MLS listing to VLS Step 1 fields
 */
export function mapToStep1(listing: MLSListing): VLSStep1Fields {
  const addressParts = parseAddress(listing.address);

  return {
    classification: mapPropertyType(listing.propertyType),
    listing_type: 'Exclusive or MLS listed',
    for_sale: true,
    for_rent: false,
    street_num: addressParts.number,
    street_name: addressParts.name,
    street_type: addressParts.type,
    zip: listing.zip,
    country: 'United States',
    address_display: 'Full Address on Public Sites',
    categories: [],
  };
}

/**
 * Map MLS listing to VLS Step 2 fields
 */
export function mapToStep2(listing: MLSListing): VLSStep2Fields {
  const fullBaths = Math.floor(listing.bathrooms);
  const halfBaths = listing.bathrooms % 1 >= 0.5 ? 1 : 0;

  return {
    sale_price: listing.price,
    town: listing.city,
    area: '',
    school_district: '',
    bathrooms_full: fullBaths,
    bathrooms_half: halfBaths,
    style: '',
    beds: listing.bedrooms,
    condition: '',
    rooms: 0,
    construct: '',
    families: 1,
    kitchens: 1,
    sqft: listing.sqft,
    drive: '',
    stories: 0,
    lot_size: listing.lotSize?.toString() || '',
    basement: '',
    acreage: '',
    patio: '',
    taxes: 0,
    porch: '',
    year_built: listing.yearBuilt || 0,
    age: 0,
    description: listing.description,
    co_listor: '',

    // Options - default all to false
    den: false,
    eik: false,
    tennis: false,
    attic: false,
    dining: false,
    fireplace: 0,
    waterview: false,
    office: false,
    carpet: false,
    garage_num: 0,
    garage_type: '',
    waterfront: false,
    fin_bsmt: false,
    pool_type: '',
    water_type: '',
  };
}

/**
 * Parse address string into components
 */
export function parseAddress(address: string): {
  number: string;
  name: string;
  type: string;
  unit?: string;
} {
  // Common street type abbreviations
  const streetTypes = [
    'St', 'Street', 'Ave', 'Avenue', 'Blvd', 'Boulevard', 'Rd', 'Road',
    'Dr', 'Drive', 'Ln', 'Lane', 'Ct', 'Court', 'Cir', 'Circle',
    'Way', 'Pl', 'Place', 'Ter', 'Terrace', 'Pkwy', 'Parkway',
    'Hwy', 'Highway', 'Trl', 'Trail', 'Path', 'Pass',
  ];

  // Normalize and split address
  const normalized = address.replace(/,/g, ' ').trim();
  const parts = normalized.split(/\s+/);

  if (parts.length === 0) {
    return { number: '', name: address, type: '' };
  }

  // First part is usually the street number
  const number = /^\d+/.test(parts[0]) ? parts[0] : '';
  const startIndex = number ? 1 : 0;

  // Find street type
  let typeIndex = -1;
  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].replace(/\.$/, ''); // Remove trailing period
    if (streetTypes.some(t => t.toLowerCase() === part.toLowerCase())) {
      typeIndex = i;
      break;
    }
  }

  if (typeIndex === -1) {
    // No street type found - use last word as name
    return {
      number,
      name: parts.slice(startIndex).join(' '),
      type: '',
    };
  }

  return {
    number,
    name: parts.slice(startIndex, typeIndex).join(' '),
    type: parts[typeIndex],
    unit: typeIndex < parts.length - 1 ? parts.slice(typeIndex + 1).join(' ') : undefined,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Normalize MLS listing data for VLS
 */
export function normalizeListingData(listing: MLSListing): MLSListing {
  return {
    ...listing,
    // Ensure price is a number
    price: typeof listing.price === 'string' ? parseInt(listing.price, 10) : listing.price,
    // Ensure sqft is a number
    sqft: typeof listing.sqft === 'string' ? parseInt(listing.sqft, 10) : listing.sqft,
    // Ensure bedrooms is a number
    bedrooms: typeof listing.bedrooms === 'string' ? parseInt(listing.bedrooms, 10) : listing.bedrooms,
    // Ensure bathrooms is a number
    bathrooms: typeof listing.bathrooms === 'string' ? parseFloat(listing.bathrooms) : listing.bathrooms,
    // Normalize property type
    propertyType: listing.propertyType || 'Single Family',
    // Clean description
    description: (listing.description || '').trim(),
  };
}

/**
 * Bridge API Client
 *
 * Fetches MLS listings from Bridge Interactive's RESO Web API
 * https://api.bridgedataoutput.com/api/v2/OData/{mlsId}/Property
 */

import type { MLSListing, MLSCredentials, SearchCriteria, PropertyType } from './types';

const BRIDGE_API_BASE = 'https://api.bridgedataoutput.com/api/v2/OData';

// Map RESO property types to our PropertyType
const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  'Residential': 'Single Family',
  'Residential Income': 'Multi-Family',
  'Condominium': 'Condo',
  'Townhouse': 'Townhouse',
  'Land': 'Land',
  'Commercial': 'Commercial',
  'Commercial Sale': 'Commercial',
};

export interface BridgeAPIConfig {
  credentials: MLSCredentials;
}

export interface BridgeAPIResponse {
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
  value: BridgeProperty[];
}

// Bridge/RESO Property structure (partial - key fields only)
export interface BridgeProperty {
  ListingKey: string;
  ListingId: string;
  ListPrice: number;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LotSizeSquareFeet?: number;
  LotSizeAcres?: number;
  YearBuilt?: number;
  PropertyType?: string;
  PropertySubType?: string;
  PublicRemarks?: string;
  StandardStatus?: string;
  MlsStatus?: string;
  ListAgentFullName?: string;
  ListAgentDirectPhone?: string;
  ListAgentEmail?: string;
  ListingContractDate?: string;
  ModificationTimestamp?: string;
  Media?: BridgeMedia[];
  GarageSpaces?: number;
  PoolPrivateYN?: boolean;
  WaterfrontYN?: boolean;
  SubdivisionName?: string;
  CountyOrParish?: string;
  TaxAnnualAmount?: number;
  AssociationFee?: number;
}

export interface BridgeMedia {
  MediaKey: string;
  MediaURL: string;
  MediaType: string;
  Order: number;
  ShortDescription?: string;
}

export class BridgeAPIClient {
  private config: BridgeAPIConfig;

  constructor(config: BridgeAPIConfig) {
    this.config = config;
  }

  /**
   * Build OData filter string from search criteria
   */
  private buildFilter(criteria: SearchCriteria): string {
    const filters: string[] = [];

    // Status filter - default to Active
    if (criteria.listingStatus && criteria.listingStatus.length > 0) {
      const statusFilters = criteria.listingStatus.map(s => `StandardStatus eq '${s}'`);
      filters.push(`(${statusFilters.join(' or ')})`);
    } else {
      filters.push("StandardStatus eq 'Active'");
    }

    // City filter
    if (criteria.cities && criteria.cities.length > 0) {
      const cityFilters = criteria.cities.map(c => `City eq '${c}'`);
      filters.push(`(${cityFilters.join(' or ')})`);
    }

    // Zip code filter
    if (criteria.zipCodes && criteria.zipCodes.length > 0) {
      const zipFilters = criteria.zipCodes.map(z => `PostalCode eq '${z}'`);
      filters.push(`(${zipFilters.join(' or ')})`);
    }

    // County filter - use contains for flexible matching
    if (criteria.county) {
      // Use contains() for partial matching (handles "Miami-Dade", "MIAMI-DADE", etc.)
      filters.push(`contains(tolower(CountyOrParish), '${criteria.county.toLowerCase()}')`);
    }

    // Price range
    if (criteria.minPrice !== undefined) {
      filters.push(`ListPrice ge ${criteria.minPrice}`);
    }
    if (criteria.maxPrice !== undefined) {
      filters.push(`ListPrice le ${criteria.maxPrice}`);
    }

    // Bedrooms
    if (criteria.minBeds !== undefined) {
      filters.push(`BedroomsTotal ge ${criteria.minBeds}`);
    }
    if (criteria.maxBeds !== undefined) {
      filters.push(`BedroomsTotal le ${criteria.maxBeds}`);
    }

    // Bathrooms
    if (criteria.minBaths !== undefined) {
      filters.push(`BathroomsTotalInteger ge ${criteria.minBaths}`);
    }
    if (criteria.maxBaths !== undefined) {
      filters.push(`BathroomsTotalInteger le ${criteria.maxBaths}`);
    }

    // Square footage
    if (criteria.minSqft !== undefined) {
      filters.push(`LivingArea ge ${criteria.minSqft}`);
    }
    if (criteria.maxSqft !== undefined) {
      filters.push(`LivingArea le ${criteria.maxSqft}`);
    }

    // Property types
    if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
      // Map our property types back to RESO types
      const resoTypes: string[] = [];
      for (const pt of criteria.propertyTypes) {
        for (const [resoType, ourType] of Object.entries(PROPERTY_TYPE_MAP)) {
          if (ourType === pt) {
            resoTypes.push(resoType);
          }
        }
      }
      if (resoTypes.length > 0) {
        const typeFilters = resoTypes.map(t => `PropertyType eq '${t}'`);
        filters.push(`(${typeFilters.join(' or ')})`);
      }
    }

    return filters.join(' and ');
  }

  /**
   * Fetch listings from Bridge API
   */
  async fetchListings(criteria: SearchCriteria, limit: number = 50): Promise<MLSListing[]> {
    const { credentials } = this.config;
    const { serverToken, mlsId } = credentials;

    // Build the API URL
    const baseUrl = `${BRIDGE_API_BASE}/${mlsId}/Property`;

    // Build query parameters
    const params = new URLSearchParams();
    params.set('access_token', serverToken);
    params.set('$top', limit.toString());

    // Select specific fields to reduce payload
    params.set('$select', [
      'ListingKey', 'ListingId', 'ListPrice',
      'StreetNumber', 'StreetName', 'StreetSuffix', 'UnitNumber',
      'City', 'StateOrProvince', 'PostalCode',
      'BedroomsTotal', 'BathroomsTotalInteger', 'BathroomsFull', 'BathroomsHalf',
      'LivingArea', 'LotSizeSquareFeet', 'YearBuilt',
      'PropertyType', 'PropertySubType', 'PublicRemarks',
      'StandardStatus', 'MlsStatus',
      'ListAgentFullName', 'ListAgentDirectPhone', 'ListAgentEmail',
      'ListingContractDate', 'ModificationTimestamp',
      'GarageSpaces', 'PoolPrivateYN', 'WaterfrontYN',
      'SubdivisionName', 'CountyOrParish', 'TaxAnnualAmount', 'AssociationFee',
    ].join(','));

    // Expand media to get image URLs
    params.set('$expand', 'Media($top=10)');

    // Build filter
    const filter = this.buildFilter(criteria);
    if (filter) {
      params.set('$filter', filter);
    }

    // Order by newest first
    params.set('$orderby', 'ModificationTimestamp desc');

    const url = `${baseUrl}?${params.toString()}`;
    console.log('[Bridge API] Fetching:', url.replace(serverToken, '***'));

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Bridge API] Error response:', errorText);
        throw new Error(`Bridge API error: ${response.status} ${response.statusText}`);
      }

      const data: BridgeAPIResponse = await response.json();
      console.log(`[Bridge API] Received ${data.value?.length || 0} listings`);

      // Convert Bridge properties to our MLSListing format
      return this.convertListings(data.value || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Bridge API] Fetch failed:', message);
      throw error;
    }
  }

  /**
   * Convert Bridge API properties to our MLSListing format
   */
  private convertListings(properties: BridgeProperty[]): MLSListing[] {
    return properties.map(prop => this.convertProperty(prop));
  }

  /**
   * Convert a single Bridge property to MLSListing
   */
  private convertProperty(prop: BridgeProperty): MLSListing {
    // Build full address
    const addressParts = [
      prop.StreetNumber,
      prop.StreetName,
      prop.StreetSuffix,
    ].filter(Boolean);
    let address = addressParts.join(' ');
    if (prop.UnitNumber) {
      address += ` #${prop.UnitNumber}`;
    }

    // Get image URLs from Media - store MediaKeys for later URL construction
    const imageUrls: string[] = [];
    if (prop.Media && prop.Media.length > 0) {
      // Sort by Order and get URLs
      const sortedMedia = [...prop.Media].sort((a, b) => (a.Order || 0) - (b.Order || 0));
      for (const media of sortedMedia) {
        if (media.MediaURL) {
          // Use direct URL if provided
          imageUrls.push(media.MediaURL);
        } else if (media.MediaKey) {
          // Construct URL using Bridge API media endpoint with auth
          // Format: https://api.bridgedataoutput.com/api/v2/OData/{mlsId}/Media('{MediaKey}')/content?access_token={token}
          const imageUrl = `https://api.bridgedataoutput.com/api/v2/zgateway/media/${media.MediaKey}`;
          imageUrls.push(imageUrl);
        }
      }
      console.log(`[Bridge API] Found ${imageUrls.length} images for ${prop.ListingId}`);
    } else {
      console.log(`[Bridge API] No Media array for ${prop.ListingId}`);
    }

    // Calculate total bathrooms
    const bathrooms = (prop.BathroomsFull || 0) + ((prop.BathroomsHalf || 0) * 0.5);

    // Map property type
    const propertyType = PROPERTY_TYPE_MAP[prop.PropertyType || ''] || 'Other';

    // Map status
    let status: MLSListing['status'] = 'Active';
    const bridgeStatus = prop.StandardStatus || prop.MlsStatus || '';
    if (bridgeStatus.toLowerCase().includes('pending')) {
      status = 'Pending';
    } else if (bridgeStatus.toLowerCase().includes('sold') || bridgeStatus.toLowerCase().includes('closed')) {
      status = 'Sold';
    } else if (bridgeStatus.toLowerCase().includes('withdrawn')) {
      status = 'Withdrawn';
    } else if (bridgeStatus.toLowerCase().includes('expired')) {
      status = 'Expired';
    }

    return {
      mlsNumber: prop.ListingId || prop.ListingKey,
      address,
      city: prop.City || '',
      state: prop.StateOrProvince || 'FL',
      zip: prop.PostalCode || '',
      price: prop.ListPrice || 0,
      bedrooms: prop.BedroomsTotal || 0,
      bathrooms: bathrooms || prop.BathroomsTotalInteger || 0,
      sqft: prop.LivingArea || 0,
      lotSize: prop.LotSizeSquareFeet,
      yearBuilt: prop.YearBuilt,
      propertyType,
      description: prop.PublicRemarks || '',
      imageUrls,
      listingAgentName: prop.ListAgentFullName,
      listingAgentPhone: prop.ListAgentDirectPhone,
      listingAgentEmail: prop.ListAgentEmail,
      listingDate: prop.ListingContractDate ? new Date(prop.ListingContractDate) : undefined,
      status,
      garage: prop.GarageSpaces,
      pool: prop.PoolPrivateYN,
      waterfront: prop.WaterfrontYN,
      subdivision: prop.SubdivisionName,
      county: prop.CountyOrParish,
      taxAmount: prop.TaxAnnualAmount,
      hoaFee: prop.AssociationFee,
    };
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const { credentials } = this.config;
      const { serverToken, mlsId } = credentials;

      // Simple query to test connection
      const url = `${BRIDGE_API_BASE}/${mlsId}/Property?access_token=${serverToken}&$top=1&$select=ListingKey`;

      console.log('[Bridge API] Testing connection...');
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
        };
      }

      const data: BridgeAPIResponse = await response.json();

      return {
        success: true,
        message: `Connected to ${mlsId} successfully`,
        count: data['@odata.count'],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Connection failed: ${message}`,
      };
    }
  }
}

/**
 * Create a Bridge API client
 */
export function createBridgeAPIClient(credentials: MLSCredentials): BridgeAPIClient {
  return new BridgeAPIClient({ credentials });
}

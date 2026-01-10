/**
 * VLS Homes Poster
 *
 * Puppeteer automation for posting listings to VLS Homes
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import type { MLSListing, VLSCredentials } from '../mls/types';

export interface VLSPosterConfig {
  credentials: VLSCredentials;
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
}

export interface PostResult {
  success: boolean;
  vlsListingId?: string;
  error?: string;
}

// VLS Homes URLs
const VLS_URLS = {
  login: 'https://vlshomes.com/members_mobi/passgen.cfm',
  dashboard: 'https://vlshomes.com/members_mobi/brokers.cfm',
  addListing: 'https://vlshomes.com/members_mobi/manform.cfm?short=t',
  myListings: 'https://vlshomes.com/members_mobi/matchedt.cfm?limit=sales',
};

// Property type mapping from MLS to VLS classification
const PROPERTY_TYPE_MAP: Record<string, string> = {
  'Single Family': 'RES',
  'House': 'RES',
  'Condo': 'CON',
  'Condominium': 'CON',
  'Co-op': 'COP',
  'Cooperative': 'COP',
  'Land': 'LAN',
  'Lot': 'LAN',
  'Commercial': 'COM',
  'Rental': 'REN',
  'Apartment': 'REN',
};

export class VLSPoster {
  private config: VLSPosterConfig;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn: boolean = false;

  constructor(config: VLSPosterConfig) {
    this.config = {
      headless: true,
      slowMo: 50,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Initialize browser
   */
  async init(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(this.config.timeout || 30000);

    // Set viewport
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }

  /**
   * Login to VLS Homes
   */
  async login(): Promise<boolean> {
    if (!this.page) await this.init();
    if (this.isLoggedIn) return true;

    try {
      const page = this.page!;

      // Navigate to login page
      await page.goto(VLS_URLS.login, { waitUntil: 'networkidle2' });

      // Fill in credentials
      await page.type('input[type="text"]', this.config.credentials.email);
      await page.type('input[type="password"]', this.config.credentials.password);

      // Click login button
      await page.click('input[type="submit"]');

      // Wait for navigation to secure page
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Check if we're on the secure/welcome page
      const url = page.url();
      if (url.includes('secure.cfm')) {
        // Click Continue button
        await page.click('a.btn, input[type="submit"], button');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }

      // Verify we're logged in (should be on dashboard)
      const currentUrl = page.url();
      this.isLoggedIn = currentUrl.includes('brokers.cfm') ||
                        currentUrl.includes('members_mobi');

      return this.isLoggedIn;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  /**
   * Post a listing to VLS Homes
   */
  async postListing(listing: MLSListing, imagePaths: string[]): Promise<PostResult> {
    if (!this.page) await this.init();

    // Ensure logged in
    if (!this.isLoggedIn) {
      const loggedIn = await this.login();
      if (!loggedIn) {
        return { success: false, error: 'Failed to login to VLS Homes' };
      }
    }

    try {
      const page = this.page!;

      // Step 1: Navigate to Add Listing form
      await page.goto(VLS_URLS.addListing, { waitUntil: 'networkidle2' });

      // Step 2: Fill Step 1 - Basic Info
      await this.fillStep1(page, listing);

      // Step 3: Click Continue and wait for Step 2
      await page.click('input[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 4: Fill Step 2 - Property Details
      await this.fillStep2(page, listing);

      // Step 5: Submit the listing
      await page.click('input[type="submit"][value="Submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 6: Extract VLS listing ID from URL
      const currentUrl = page.url();
      const listingIdMatch = currentUrl.match(/in_listing=(\d+)/);
      const vlsListingId = listingIdMatch ? listingIdMatch[1] : undefined;

      // Step 7: Upload images if available
      if (vlsListingId && imagePaths.length > 0) {
        await this.uploadImages(page, vlsListingId, imagePaths);
      }

      return {
        success: true,
        vlsListingId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to post listing:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Fill Step 1 - Basic listing info
   */
  private async fillStep1(page: Page, listing: MLSListing): Promise<void> {
    // Select classification (property type)
    const classification = PROPERTY_TYPE_MAP[listing.propertyType] || 'RES';
    await page.click(`input[type="radio"][value="${classification}"]`);

    // Select "For Sale" checkbox (assuming sales for now)
    const forSaleCheckbox = await page.$('input[type="checkbox"][name="forsale"]');
    if (forSaleCheckbox) {
      const isChecked = await page.evaluate(el => (el as HTMLInputElement).checked, forSaleCheckbox);
      if (!isChecked) {
        await forSaleCheckbox.click();
      }
    }

    // Parse address components
    const addressParts = this.parseAddress(listing.address);

    // Fill street number
    const streetNumInput = await page.$('input[name="street_num"]');
    if (streetNumInput) {
      await streetNumInput.type(addressParts.number);
    }

    // Fill street name
    const streetNameInput = await page.$('input[name="street_name"]');
    if (streetNameInput) {
      await streetNameInput.type(addressParts.name);
    }

    // Fill street type
    const streetTypeInput = await page.$('input[name="street_type"]');
    if (streetTypeInput) {
      await streetTypeInput.type(addressParts.type);
    }

    // Fill zip code
    const zipInput = await page.$('input[name="zip"]');
    if (zipInput) {
      await zipInput.type(listing.zip);
    }
  }

  /**
   * Fill Step 2 - Property details
   */
  private async fillStep2(page: Page, listing: MLSListing): Promise<void> {
    // Sale Price
    const priceInput = await page.$('input[name="lp"]');
    if (priceInput) {
      await priceInput.click({ clickCount: 3 }); // Select all
      await priceInput.type(listing.price.toString());
    }

    // Bedrooms (dropdown)
    await this.selectDropdown(page, 'select[name="beds"]', listing.bedrooms.toString());

    // Bathrooms Full (dropdown)
    const fullBaths = Math.floor(listing.bathrooms);
    await this.selectDropdown(page, 'select[name="fbaths"]', fullBaths.toString());

    // Bathrooms Half (dropdown)
    const halfBaths = listing.bathrooms % 1 >= 0.5 ? 1 : 0;
    await this.selectDropdown(page, 'select[name="hbaths"]', halfBaths.toString());

    // Square footage
    const sqftInput = await page.$('input[name="sqft"]');
    if (sqftInput) {
      await sqftInput.click({ clickCount: 3 });
      await sqftInput.type(listing.sqft.toString());
    }

    // Year built
    if (listing.yearBuilt) {
      const yearInput = await page.$('input[name="yr_blt"]');
      if (yearInput) {
        await yearInput.type(listing.yearBuilt.toString());
      }
    }

    // Lot size
    if (listing.lotSize) {
      const lotInput = await page.$('input[name="lot_sz"]');
      if (lotInput) {
        await lotInput.type(listing.lotSize.toString());
      }
    }

    // Property description
    const descTextarea = await page.$('textarea[name="remarks"]');
    if (descTextarea) {
      await descTextarea.type(listing.description || '');
    }
  }

  /**
   * Upload images to a listing
   */
  private async uploadImages(page: Page, listingId: string, imagePaths: string[]): Promise<void> {
    // Navigate to listing menu
    await page.goto(`https://vlshomes.com/members_mobi/listmenu.cfm?in_listing=${listingId}`, {
      waitUntil: 'networkidle2',
    });

    // Try to find and click "Upload Main photo" or "Upload New Image"
    const uploadLink = await page.$('a[href*="ask_multiple"]');
    if (uploadLink) {
      try {
        await uploadLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

        // Look for file input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput && imagePaths.length > 0) {
          // Upload first image as main photo
          await fileInput.uploadFile(imagePaths[0]);

          // Submit the form
          const submitBtn = await page.$('input[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
          }
        }
      } catch (error) {
        // Photo upload page may have issues (500 error observed)
        console.warn('Photo upload may have failed:', error);
      }
    }
  }

  /**
   * Check if a listing already exists on VLS Homes
   */
  async checkDuplicate(mlsNumber: string): Promise<boolean> {
    if (!this.page) await this.init();
    if (!this.isLoggedIn) await this.login();

    try {
      const page = this.page!;

      // Navigate to listings page and search
      await page.goto(VLS_URLS.myListings, { waitUntil: 'networkidle2' });

      // Check if MLS number appears on the page
      const pageContent = await page.content();
      return pageContent.includes(mlsNumber);
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return false;
    }
  }

  /**
   * Delete a listing from VLS Homes
   */
  async deleteListing(vlsListingId: string): Promise<boolean> {
    if (!this.page) await this.init();
    if (!this.isLoggedIn) await this.login();

    try {
      const page = this.page!;

      // Navigate to delete page
      await page.goto(`https://vlshomes.com/members_mobi/upddel.cfm?in_listing=${vlsListingId}`, {
        waitUntil: 'networkidle2',
      });

      // Click delete button
      await page.click('input[type="submit"][value="Delete"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      return true;
    } catch (error) {
      console.error('Delete listing failed:', error);
      return false;
    }
  }

  /**
   * Parse address into components
   */
  private parseAddress(address: string): { number: string; name: string; type: string } {
    // Basic address parsing (e.g., "123 Main St" -> { number: "123", name: "Main", type: "St" })
    const parts = address.trim().split(/\s+/);

    if (parts.length >= 3) {
      return {
        number: parts[0],
        name: parts.slice(1, -1).join(' '),
        type: parts[parts.length - 1],
      };
    } else if (parts.length === 2) {
      return {
        number: parts[0],
        name: parts[1],
        type: '',
      };
    } else {
      return {
        number: '',
        name: address,
        type: '',
      };
    }
  }

  /**
   * Select dropdown option by value
   */
  private async selectDropdown(page: Page, selector: string, value: string): Promise<void> {
    try {
      await page.select(selector, value);
    } catch (error) {
      // Try clicking option directly if select doesn't work
      const dropdown = await page.$(selector);
      if (dropdown) {
        await dropdown.click();
        await page.waitForSelector(`${selector} option[value="${value}"]`);
        await page.click(`${selector} option[value="${value}"]`);
      }
    }
  }
}

/**
 * Create a VLS poster instance
 */
export function createVLSPoster(credentials: VLSCredentials): VLSPoster {
  return new VLSPoster({ credentials });
}

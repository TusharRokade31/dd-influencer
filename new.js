// glewee-scraper.js
const https = require('https');
const fs = require('fs');

class GleweeInfluencerScraper {
    constructor() {
        this.baseUrl = 'https://api.glewee.io/api/v2/marketplace/profiles/all?order_by=-followers&age%5Brange%5D=13%3A65&image%5Bexists%5D=true&size=50&page=';
        this.profileUrl = 'https://api.glewee.io/api/v2/profiles/';
        this.allInfluencers = [];
        this.totalCount = 11794;
        this.pageSize = 50;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.authToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik01VlpUd25oZVRoY0FOSU5RZE5KQiJ9.eyJpc3MiOiJodHRwczovL2dsZXdlZS51cy5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NjdkZGI1NWZlNWJjMjM1MTUyNzliMmZmIiwiYXVkIjpbImh0dHBzOi8vYXBpLmdsZXdlZS5pby9hcGkvdjIvIiwiaHR0cHM6Ly9nbGV3ZWUudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc0OTMwMzczMCwiZXhwIjoxNzQ5MzA3MzMwLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIGFkZHJlc3MgcGhvbmUgb2ZmbGluZV9hY2Nlc3MiLCJndHkiOiJwYXNzd29yZCIsImF6cCI6IlNQcHdPdlBXWm9oTHNSZmw5Z3h3YUl5Q1dUZ0cxOG5KIiwicGVybWlzc2lvbnMiOltdfQ.lRGXBqqSr8y1r8kSQinp2Rjjqrr37wy1jIVFA1laUYIu3KHooBCTS1JLa9si0hrnifK2XnLtGAoZ70gd4Ov65__w5CY5k3alXD3mNjvMh90pzx5zzobco-GkZpFGNYurzgh_Pmq-gvVI095awgg00WAjEXNeIFATCDVYmeyZKca7xN-OnbfLthrXe7zOaw5rP3_p0PmqUHBvIHl6NKSQ_LEi5klXKwS1QvaaVhz-SGMJQ4ZFe8CBvjMDKjJ9DA5eiUqyeKCDdufylF-gs2sUSaBO6p3hmK02ucgLjhop7DmnctLOlJ6YMDTQCk7muc39ekesDWU6FYQ4-QXBz_sgGg';
        this.skippedCount = 0;
        this.errorCount = 0;
    }

    async fetchPage(page) {
        const url = this.baseUrl + page;
        
        return new Promise((resolve, reject) => {
            console.log(`Fetching page ${page}/${this.totalPages}...`);
            
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Authorization': this.authToken
                }
            };

            const req = https.get(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const jsonData = JSON.parse(data);
                            
                            // Filter out null/undefined results and add validation
                            if (jsonData && jsonData.results && Array.isArray(jsonData.results)) {
                                const originalCount = jsonData.results.length;
                                jsonData.results = jsonData.results.filter(item => {
                                    if (!item || item === null || item === undefined) {
                                        this.skippedCount++;
                                        return false;
                                    }
                                    return true;
                                });
                                
                                if (originalCount !== jsonData.results.length) {
                                    console.log(`⚠️ Filtered out ${originalCount - jsonData.results.length} null/undefined items from page ${page}`);
                                }
                            }
                            
                            resolve(jsonData);
                        } else {
                            console.error(`HTTP ${res.statusCode} for page ${page}`);
                            this.errorCount++;
                            resolve(null);
                        }
                    } catch (error) {
                        console.error(`JSON parse error for page ${page}:`, error.message);
                        this.errorCount++;
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`Request error for page ${page}:`, error.message);
                this.errorCount++;
                resolve(null);
            });

            req.setTimeout(15000, () => {
                console.error(`Timeout for page ${page}`);
                req.destroy();
                this.errorCount++;
                resolve(null);
            });
        });
    }

    async fetchIndividualProfile(profileId) {
        // Add validation for profileId
        if (!profileId) {
            return null;
        }
        
        const url = this.profileUrl + profileId;
        
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Authorization': this.authToken
                }
            };

            const req = https.get(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const jsonData = JSON.parse(data);
                            resolve(jsonData);
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                resolve(null);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve(null);
            });
        });
    }

    getInstagramLink(influencer, detailedProfile) {
        // Add null checks
        if (!influencer) return null;
        
        // Try to get Instagram link from detailed profile first
        if (detailedProfile && detailedProfile.social_accounts && Array.isArray(detailedProfile.social_accounts)) {
            const instagramAccount = detailedProfile.social_accounts.find(
                account => account && account.social_platform === 'Instagram'
            );
            if (instagramAccount && instagramAccount.username) {
                return `https://instagram.com/${instagramAccount.username}`;
            }
        }
        
        // Fallback to basic profile data
        if (influencer.auth_on_instagram || (influencer.platforms && Array.isArray(influencer.platforms) && influencer.platforms.includes('instagram'))) {
            const username = influencer.instagram_username || 
                            (influencer.name ? influencer.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : null) || 
                            `user${influencer.id || 'unknown'}`;
            return `https://instagram.com/${username}`;
        }
        
        return null;
    }

    processInfluencer(influencer, detailedProfile = null) {
        // Add comprehensive safety check at the beginning
        if (!influencer || influencer === null || influencer === undefined) {
            console.log('⚠️ Received null/undefined influencer, returning default values');
            this.skippedCount++;
            return {
                name: 'Unknown',
                instagram_link: null,
                followers: 0,
                category: 'N/A',
                location: 'N/A',
                id: 'unknown'
            };
        }

        // Add debug logging for problematic data
        if (!influencer.name) {
            console.log(`⚠️ Influencer ${influencer.id || 'unknown'} has no name`);
        }

        // Process categories safely
        let categoryString = 'N/A';
        if (influencer.categories && Array.isArray(influencer.categories)) {
            categoryString = influencer.categories
                .map(cat => {
                    if (!cat) return 'Unknown';
                    return cat.name || cat.toString() || 'Unknown';
                })
                .filter(cat => cat !== 'Unknown' || influencer.categories.length === 1)
                .join(', ') || 'N/A';
        }
        
        return {
            name: influencer.name || `User_${influencer.id || 'unknown'}`,
            instagram_link: this.getInstagramLink(influencer, detailedProfile),
            followers: influencer.followers || 0,
            category: categoryString,
            location: influencer.location || 'N/A',
            id: influencer.id || 'unknown'
        };
    }

    async scrapeAllInfluencers() {
        console.log(`Starting to scrape ${this.totalCount} influencers across ${this.totalPages} pages...`);
        
        for (let page = 1; page <= this.totalPages; page++) {
            try {
                const data = await this.fetchPage(page);
                
                if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
                    for (const influencer of data.results) {
                        // Add comprehensive null check
                        if (!influencer || influencer === null || influencer === undefined) {
                            console.log(`⚠️ Skipping null/undefined influencer on page ${page}`);
                            this.skippedCount++;
                            continue;
                        }
                        
                        try {
                            // Fetch detailed profile for better Instagram data
                            const detailedProfile = await this.fetchIndividualProfile(influencer.id);
                            const processedInfluencer = this.processInfluencer(influencer, detailedProfile);
                            
                            if (processedInfluencer && processedInfluencer.name !== 'Unknown') {
                                this.allInfluencers.push(processedInfluencer);
                            }
                            
                            // Small delay to avoid rate limiting
                            await this.delay(200);
                        } catch (processingError) {
                            console.error(`Error processing influencer ${influencer.id || 'unknown'} on page ${page}:`, processingError.message);
                            this.errorCount++;
                            continue;
                        }
                    }
                    
                    console.log(`✓ Page ${page} completed. Total collected: ${this.allInfluencers.length}`);
                } else {
                    console.log(`✗ Page ${page} failed, empty, or invalid format`);
                    this.errorCount++;
                }

                // Progress update every 20 pages
                if (page % 20 === 0) {
                    console.log(`Progress: ${page}/${this.totalPages} pages (${((page/this.totalPages)*100).toFixed(1)}%)`);
                    console.log(`Influencers collected: ${this.allInfluencers.length}`);
                    console.log(`Skipped: ${this.skippedCount}, Errors: ${this.errorCount}`);
                }

                // Delay between pages
                await this.delay(300);
                
            } catch (pageError) {
                console.error(`Error processing page ${page}:`, pageError.message);
                this.errorCount++;
                continue;
            }
        }

        console.log(`Scraping completed!`);
        console.log(`Total collected: ${this.allInfluencers.length} influencers`);
        console.log(`Skipped: ${this.skippedCount}, Errors: ${this.errorCount}`);
        return this.allInfluencers;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveToCSV(filename = 'influencers.csv') {
        if (this.allInfluencers.length === 0) {
            console.log('No data to save');
            return;
        }

        const headers = ['Name', 'Instagram Link', 'Followers', 'Category', 'Location', 'ID'];

        const csvContent = [
            headers.join(','),
            ...this.allInfluencers.map(inf => [
                `"${(inf.name || '').replace(/"/g, '""')}"`,
                inf.instagram_link || '',
                inf.followers || 0,
                `"${(inf.category || '').replace(/"/g, '""')}"`,
                `"${(inf.location || '').replace(/"/g, '""')}"`,
                inf.id || ''
            ].join(','))
        ].join('\n');

        try {
            fs.writeFileSync(filename, csvContent);
            console.log(`✓ Data saved to ${filename}`);
        } catch (error) {
            console.error(`Error saving to ${filename}:`, error.message);
        }
    }
}

// Main execution
async function main() {
    const scraper = new GleweeInfluencerScraper();
    
    try {
        console.log('🚀 Starting Glewee Influencer Scraper...\n');
        
        await scraper.scrapeAllInfluencers();
        
        if (scraper.allInfluencers.length > 0) {
            // Show first 3 results
            console.log('\n--- Sample Results ---');
            scraper.allInfluencers.slice(0, 3).forEach((inf, index) => {
                console.log(`${index + 1}. ${inf.name}`);
                console.log(`   Instagram: ${inf.instagram_link || 'N/A'}`);
                console.log(`   Followers: ${inf.followers}`);
                console.log(`   Category: ${inf.category || 'N/A'}`);
                console.log(`   Location: ${inf.location}\n`);
            });
            
            scraper.saveToCSV();
            console.log('\n🎉 Done! Check influencers.csv file');
            
            // Show summary statistics
            console.log(`\n--- Summary ---`);
            console.log(`Total influencers collected: ${scraper.allInfluencers.length}`);
            console.log(`Skipped null/invalid entries: ${scraper.skippedCount}`);
            console.log(`Errors encountered: ${scraper.errorCount}`);
            
        } else {
            console.log('❌ No data collected');
            console.log(`Skipped: ${scraper.skippedCount}, Errors: ${scraper.errorCount}`);
        }
        
    } catch (error) {
        console.error('❌ Main execution error:', error);
        
        // Save partial data if any
        if (scraper.allInfluencers.length > 0) {
            console.log('💾 Saving partial data...');
            scraper.saveToCSV('partial_influencers.csv');
            console.log(`✓ Partial data saved with ${scraper.allInfluencers.length} entries`);
        }
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n⚠️ Interrupted. Exiting...');
    process.exit();
});

// Run scraper
main();

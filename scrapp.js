// glewee-scraper-simple.js
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
        this.authToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik01VlpUd25oZVRoY0FOSU5RZE5KQiJ9.eyJpc3MiOiJodHRwczovL2dsZXdlZS51cy5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NjdkZGI1NWZlNWJjMjM1MTUyNzliMmZmIiwiYXVkIjpbImh0dHBzOi8vYXBpLmdsZXdlZS5pby9hcGkvdjIvIiwiaHR0cHM6Ly9nbGV3ZWUudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc0OTQ3Mzk3OCwiZXhwIjoxNzQ5NDc3NTc4LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIGFkZHJlc3MgcGhvbmUgb2ZmbGluZV9hY2Nlc3MiLCJndHkiOiJwYXNzd29yZCIsImF6cCI6IlNQcHdPdlBXWm9oTHNSZmw5Z3h3YUl5Q1dUZ0cxOG5KIiwicGVybWlzc2lvbnMiOltdfQ.ZFmZZZXv-H_8XqBCxxTIhYv3dizuyZg60L8OOIeKIk2i-V4--yy-jRgGIfCSpXrMtCZxfhgK27VIs0y4SjUDiiYRF-baE8yOAc3sN6H3j5E-L-6o8ko1BBc7jwvv2RXm_sIqg-PIyK304nO-OmzqpzuK_WQ9R0pEdZHNvtBmjULD1Y-zVv0Pfv0g8sC7rOOImaaqfGQ48bOetgu_u7NB62uOrTZHhWkPBeulXBisyGSpglC4ahcJ0hK8206OLn1itSclpHK8wSRmPc1yX5xkoINugzkIYPkt43JkaWTD_FeCsjTHv8vFxmbxpUmgttwNZY30jA31XSsprCnofwjJwA';
        this.skippedCount = 0;
        this.errorCount = 0;
        this.startPage = 31;
        this.progressFilename = 'progress_influencers.csv';
        this.finalFilename = 'influencers.csv';
    }

    // Fetch profile data to get Instagram username
    async fetchProfileData(profileId) {
        const url = this.profileUrl + profileId;
        
        return new Promise((resolve) => {
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Authorization': this.authToken
                }
            };

            const req = https.get(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        resolve(null);
                    }
                });
            });

            req.on('error', () => resolve(null));
            req.setTimeout(10000, () => {
                req.destroy();
                resolve(null);
            });
        });
    }

    // Get Instagram URL from profile data
    getInstagramUrl(profileData) {
        if (!profileData?.social_accounts) return null;
        
        const instagramAccount = profileData.social_accounts.find(
            account => account.social_platform === 'Instagram' && account.username
        );

        if (instagramAccount?.username) {
            const username = instagramAccount.username.replace(/^.*\//, '').replace('@', '');
            return `https://instagram.com/${username}`;
        }
        return null;
    }

    async fetchPage(page) {
        const url = this.baseUrl + page;
        
        return new Promise((resolve) => {
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
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else {
                            this.errorCount++;
                            resolve(null);
                        }
                    } catch (error) {
                        this.errorCount++;
                        resolve(null);
                    }
                });
            });

            req.on('error', () => {
                this.errorCount++;
                resolve(null);
            });

            req.setTimeout(15000, () => {
                req.destroy();
                this.errorCount++;
                resolve(null);
            });
        });
    }

    async processInfluencer(basicInfluencer) {
        if (!basicInfluencer?.id) {
            this.skippedCount++;
            return null;
        }

        try {
            // Fetch profile to get Instagram username
            const profileData = await this.fetchProfileData(basicInfluencer.id);
            
            if (!profileData) {
                this.errorCount++;
                return null;
            }

            // Get categories
            let categories = 'N/A';
            if (profileData.categories?.length) {
                categories = profileData.categories
                    .map(cat => cat.name)
                    .filter(name => name)
                    .join(', ') || 'N/A';
            }

            return {
                name: profileData.name || `User_${profileData.id}`,
                location: profileData.location || 'N/A',
                followers: profileData.followers || 0,
                instagram_url: this.getInstagramUrl(profileData) || 'N/A',
                categories: categories
            };

        } catch (error) {
            this.errorCount++;
            return null;
        }
    }

    saveProgressCSV() {
        if (this.allInfluencers.length === 0) return;
        
        const headers = ['Name', 'Location', 'Followers', 'Instagram URL', 'Categories'];
        const csvContent = [
            headers.join(','),
            ...this.allInfluencers.map(inf => [
                `"${inf.name.replace(/"/g, '""')}"`,
                `"${inf.location.replace(/"/g, '""')}"`,
                inf.followers,
                inf.instagram_url,
                `"${inf.categories.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        try {
            fs.writeFileSync(this.progressFilename, csvContent);
            console.log(`💾 Progress saved: ${this.allInfluencers.length} influencers`);
        } catch (error) {
            console.error(`Error saving progress:`, error.message);
        }
    }

    async scrapeAllInfluencers() {
        console.log(`Starting to scrape ${this.totalCount} influencers...`);
        
        for (let page = this.startPage; page <= this.totalPages; page++) {
            try {
                const data = await this.fetchPage(page);
                
                if (data?.results?.length) {
                    for (const basicInfluencer of data.results) {
                        const processedInfluencer = await this.processInfluencer(basicInfluencer);
                        
                        if (processedInfluencer) {
                            this.allInfluencers.push(processedInfluencer);
                        }
                        
                        await this.delay(200); // Don't hit API too hard
                    }
                    
                    console.log(`✓ Page ${page} done. Total: ${this.allInfluencers.length}`);
                } else {
                    console.log(`✗ Page ${page} failed`);
                    this.errorCount++;
                }

                // Save progress every 3 pages
                if (page % 3 === 0) {
                    this.saveProgressCSV();
                }

                await this.delay(500);
                
            } catch (pageError) {
                console.error(`Error on page ${page}:`, pageError.message);
                this.errorCount++;
            }
        }

        console.log(`\n🎉 Done! Collected: ${this.allInfluencers.length} influencers`);
        return this.allInfluencers;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveToCSV(filename = null) {
        const finalFilename = filename || this.finalFilename;
        
        if (this.allInfluencers.length === 0) {
            console.log('No data to save');
            return;
        }

        const headers = ['Name', 'Location', 'Followers', 'Instagram URL', 'Categories'];
        const csvContent = [
            headers.join(','),
            ...this.allInfluencers.map(inf => [
                `"${inf.name.replace(/"/g, '""')}"`,
                `"${inf.location.replace(/"/g, '""')}"`,
                inf.followers,
                inf.instagram_url,
                `"${inf.categories.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        try {
            fs.writeFileSync(finalFilename, csvContent);
            console.log(`✓ Data saved to ${finalFilename}`);
        } catch (error) {
            console.error(`Error saving:`, error.message);
        }
    }
}

// Main execution
async function main() {
    const scraper = new GleweeInfluencerScraper();
    
    process.on('SIGINT', () => {
        console.log('\n⚠️ Saving and exiting...');
        if (scraper.allInfluencers.length > 0) {
            scraper.saveToCSV(`backup_${Date.now()}.csv`);
        }
        process.exit(0);
    });
    
    await scraper.scrapeAllInfluencers();
    scraper.saveToCSV();
}

main();

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
        this.authToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik01VlpUd25oZVRoY0FOSU5RZE5KQiJ9.eyJpc3MiOiJodHRwczovL2dsZXdlZS51cy5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NjdkZGI1NWZlNWJjMjM1MTUyNzliMmZmIiwiYXVkIjpbImh0dHBzOi8vYXBpLmdsZXdlZS5pby9hcGkvdjIvIiwiaHR0cHM6Ly9nbGV3ZWUudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc0OTI3MzI2MywiZXhwIjoxNzQ5Mjc2ODYzLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIGFkZHJlc3MgcGhvbmUgb2ZmbGluZV9hY2Nlc3MiLCJndHkiOlsicmVmcmVzaF90b2tlbiIsInBhc3N3b3JkIl0sImF6cCI6IlNQcHdPdlBXWm9oTHNSZmw5Z3h3YUl5Q1dUZ0cxOG5KIiwicGVybWlzc2lvbnMiOltdfQ.JvbkpknUfOE258pqorTJVmDPbmuL4tojlmXZ4E6SxuGRPU0iQQMFkyDphouLT6PSLiwlKEmtA_-c9WrMwRxIfCGyiudX1utRdXkbnIqnMEzfUwYa7kzN6BipQCskcaBy-oG0PP6S2R4b7zp2SBVIBbyn19TUX1L2BNd60-YMA3j8bw_PqV_71fLhgWQKA36bqpgJX0fp1JxDE9wi_PtJONtVSuydg2xyfuHO8Don46cic1DriBwEC4m4hQIDo0JkXj8YmFgIPYtaWk-oLkkAveQdvOFYSlau6uYYHQE9DO71-e3k1mFqxBz4giWrj04GIx-0_lO2GKEdfKHb4agbXQ';
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
                            resolve(jsonData);
                        } else {
                            console.error(`HTTP ${res.statusCode} for page ${page}`);
                            resolve(null);
                        }
                    } catch (error) {
                        console.error(`JSON parse error for page ${page}:`, error.message);
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`Request error for page ${page}:`, error.message);
                resolve(null);
            });

            req.setTimeout(10000, () => {
                console.error(`Timeout for page ${page}`);
                req.destroy();
                resolve(null);
            });
        });
    }

    async fetchIndividualProfile(profileId) {
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
                            console.error(`HTTP ${res.statusCode} for profile ${profileId}`);
                            resolve(null);
                        }
                    } catch (error) {
                        console.error(`JSON parse error for profile ${profileId}:`, error.message);
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`Request error for profile ${profileId}:`, error.message);
                resolve(null);
            });

            req.setTimeout(10000, () => {
                console.error(`Timeout for profile ${profileId}`);
                req.destroy();
                resolve(null);
            });
        });
    }

    extractSocialMediaUrls(influencer, detailedProfile = null) {
        const socialUrls = {
            instagram: null,
            tiktok: null,  
            youtube: null,
            facebook: null,
            twitter: null
        };

        // Use detailed profile data if available, otherwise fall back to basic data
        const profileData = detailedProfile || influencer;

        // Extract Instagram data from detailed profile
        if (detailedProfile && detailedProfile.social_accounts) {
            const instagramAccount = detailedProfile.social_accounts.find(
                account => account.social_platform === 'Instagram'
            );
            if (instagramAccount && instagramAccount.username) {
                socialUrls.instagram = `https://instagram.com/${instagramAccount.username}`;
            }
        }

        // Fallback for other platforms using original logic
        if (!socialUrls.instagram && (influencer.auth_on_instagram || (influencer.platforms && influencer.platforms.includes('instagram')))) {
            const username = influencer.instagram_username || 
                            influencer.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 
                            `user${influencer.id}`;
            socialUrls.instagram = `https://instagram.com/${username}`;
        }
        
        if (influencer.auth_on_tiktok || (influencer.platforms && influencer.platforms.includes('tiktok'))) {
            const username = influencer.tiktok_username || 
                            influencer.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 
                            `user${influencer.id}`;
            socialUrls.tiktok = `https://tiktok.com/@${username}`;
        }
        
        if (influencer.auth_on_youtube || (influencer.platforms && influencer.platforms.includes('youtube'))) {
            const username = influencer.youtube_username || 
                            influencer.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 
                            `user${influencer.id}`;
            socialUrls.youtube = `https://youtube.com/@${username}`;
        }
        
        if (influencer.auth_on_facebook || (influencer.platforms && influencer.platforms.includes('facebook'))) {
            const username = influencer.facebook_username || 
                            influencer.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 
                            `user${influencer.id}`;
            socialUrls.facebook = `https://facebook.com/${username}`;
        }
        
        if (influencer.auth_on_twitter || (influencer.platforms && influencer.platforms.includes('twitter'))) {
            const username = influencer.twitter_username || 
                            influencer.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 
                            `user${influencer.id}`;
            socialUrls.twitter = `https://twitter.com/${username}`;
        }

        return socialUrls;
    }

    processInfluencer(influencer, detailedProfile = null) {
        const socialUrls = this.extractSocialMediaUrls(influencer, detailedProfile);
        
        // Extract Instagram data from detailed profile
        let instagramFollowers = influencer.followers_on_instagram || 0;
        let instagramUserId = null;
        let instagramUsername = null;

        if (detailedProfile && detailedProfile.social_accounts) {
            const instagramAccount = detailedProfile.social_accounts.find(
                account => account.social_platform === 'Instagram'
            );
            if (instagramAccount) {
                instagramFollowers = instagramAccount.followers || instagramFollowers;
                instagramUserId = instagramAccount.id || instagramAccount.user_id || null;
                instagramUsername = instagramAccount.username || null;
            }
        }
        
        return {
            name: influencer.name || 'N/A',
            id: influencer.id,
            instagram_url: socialUrls.instagram,
            instagram_username: instagramUsername,
            instagram_user_id: instagramUserId,
            tiktok_url: socialUrls.tiktok,
            youtube_url: socialUrls.youtube,
            facebook_url: socialUrls.facebook,
            twitter_url: socialUrls.twitter,
            // Enhanced Instagram data
            instagram_followers: instagramFollowers,
            tiktok_followers: influencer.followers_on_tiktok || 0,
            youtube_followers: influencer.followers_on_youtube || 0,
            facebook_followers: influencer.followers_on_facebook || 0,
            twitter_followers: influencer.followers_on_twitter || 0,
            total_followers: influencer.followers || 0,
            // Additional data
            categories: (influencer.categories || []).join(', '),
            location: influencer.location || 'N/A',
            location_zone: influencer.location_zone || 'N/A',
            platforms: (influencer.platforms || []).join(', '),
            auth_platforms: (influencer.auth_platforms || []).join(', '),
            gender: influencer.gender || 'N/A',
            birthday: influencer.birthday || 'N/A',
            age_range: influencer.age ? `${influencer.age}` : 'N/A',
            lowest_price: influencer.lowest_price || 0,
            highest_price: influencer.highest_price || 0,
            match_count: influencer.match_count || 0,
            trending: influencer.trending || 0,
            // Flag to indicate if detailed data was fetched
            detailed_data_fetched: detailedProfile ? true : false
        };
    }

    async scrapeAllInfluencers(fetchDetailedProfiles = true) {
        console.log(`Starting to scrape ${this.totalCount} influencers across ${this.totalPages} pages...`);
        if (fetchDetailedProfiles) {
            console.log('Will fetch detailed profile data for Instagram followers and user IDs...');
        }
        console.log('This may take a while. Please be patient...\n');
        
        let successfulPages = 0;
        let failedPages = 0;
        let detailedProfilesFetched = 0;
        let detailedProfilesFailed = 0;

        for (let page = 1; page <= this.totalPages; page++) {
            const data = await this.fetchPage(page);
            
            if (data && data.results && data.results.length > 0) {
                for (const influencer of data.results) {
                    let detailedProfile = null;
                    
                    if (fetchDetailedProfiles) {
                        console.log(`Fetching detailed profile for ${influencer.name} (ID: ${influencer.id})...`);
                        detailedProfile = await this.fetchIndividualProfile(influencer.id);
                        
                        if (detailedProfile) {
                            detailedProfilesFetched++;
                        } else {
                            detailedProfilesFailed++;
                        }
                        
                        // Rate limiting for individual profiles
                        await this.delay(500);
                    }
                    
                    const processedInfluencer = this.processInfluencer(influencer, detailedProfile);
                    this.allInfluencers.push(processedInfluencer);
                }
                
                successfulPages++;
                console.log(`✓ Page ${page} completed. Collected: ${this.allInfluencers.length} influencers`);
                if (fetchDetailedProfiles) {
                    console.log(`  Detailed profiles: ${detailedProfilesFetched} fetched, ${detailedProfilesFailed} failed`);
                }
            } else {
                failedPages++;
                console.log(`✗ Page ${page} failed or empty`);
                
                // If too many consecutive failures, stop
                if (failedPages > 10 && successfulPages === 0) {
                    console.log('Too many failures. Stopping...');
                    break;
                }
            }

            // Progress update every 10 pages (reduced frequency due to detailed fetching)
            if (page % 10 === 0) {
                console.log(`\n--- Progress Update ---`);
                console.log(`Pages processed: ${page}/${this.totalPages} (${((page/this.totalPages)*100).toFixed(1)}%)`);
                console.log(`Influencers collected: ${this.allInfluencers.length}`);
                console.log(`Successful pages: ${successfulPages}, Failed pages: ${failedPages}`);
                if (fetchDetailedProfiles) {
                    console.log(`Detailed profiles: ${detailedProfilesFetched} fetched, ${detailedProfilesFailed} failed`);
                }
                
                // Save progress backup
                this.saveProgress(page);
                console.log(`Progress saved!\n`);
            }

            // Rate limiting between pages
            await this.delay(300);
        }

        console.log(`\n🎉 Scraping completed!`);
        console.log(`Total influencers collected: ${this.allInfluencers.length}`);
        console.log(`Successful pages: ${successfulPages}/${this.totalPages}`);
        if (fetchDetailedProfiles) {
            console.log(`Detailed profiles fetched: ${detailedProfilesFetched}/${this.allInfluencers.length}`);
            console.log(`Success rate for detailed profiles: ${((detailedProfilesFetched/this.allInfluencers.length)*100).toFixed(1)}%`);
        }
        
        return this.allInfluencers;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveProgress(currentPage) {
        const progressData = {
            currentPage,
            totalInfluencers: this.allInfluencers.length,
            data: this.allInfluencers
        };
        fs.writeFileSync(`progress_page_${currentPage}.json`, JSON.stringify(progressData, null, 2));
    }

    saveToJSON(filename = 'glewee_influencers_detailed.json') {
        const jsonData = JSON.stringify(this.allInfluencers, null, 2);
        fs.writeFileSync(filename, jsonData);
        console.log(`✓ Data saved to ${filename}`);
    }

    saveToCSV(filename = 'glewee_influencers_detailed.csv') {
        if (this.allInfluencers.length === 0) {
            console.log('No data to save');
            return;
        }

        const headers = [
            'Name',
            'ID', 
            'Instagram URL',
            'Instagram Username',
            'Instagram User ID',
            'TikTok URL',
            'YouTube URL',
            'Facebook URL',
            'Twitter URL',
            'Instagram Followers',
            'TikTok Followers', 
            'YouTube Followers',
            'Facebook Followers',
            'Twitter Followers',
            'Total Followers',
            'Categories',
            'Location',
            'Location Zone',
            'Gender',
            'Birthday',
            'Age Range',
            'Lowest Price',
            'Highest Price',
            'Match Count',
            'Trending',
            'Platforms',
            'Auth Platforms',
            'Detailed Data Fetched'
        ];

        const csvContent = [
            headers.join(','),
            ...this.allInfluencers.map(influencer => [
                `"${(influencer.name || '').replace(/"/g, '""')}"`,
                influencer.id || '',
                influencer.instagram_url || '',
                influencer.instagram_username || '',
                influencer.instagram_user_id || '',
                influencer.tiktok_url || '',
                influencer.youtube_url || '',
                influencer.facebook_url || '',
                influencer.twitter_url || '',
                influencer.instagram_followers || 0,
                influencer.tiktok_followers || 0,
                influencer.youtube_followers || 0,
                influencer.facebook_followers || 0,
                influencer.twitter_followers || 0,
                influencer.total_followers || 0,
                `"${(influencer.categories || '').replace(/"/g, '""')}"`,
                `"${(influencer.location || '').replace(/"/g, '""')}"`,
                `"${(influencer.location_zone || '').replace(/"/g, '""')}"`,
                `"${(influencer.gender || '').replace(/"/g, '""')}"`,
                `"${(influencer.birthday || '').replace(/"/g, '""')}"`,
                `"${(influencer.age_range || '').replace(/"/g, '""')}"`,
                influencer.lowest_price || 0,
                influencer.highest_price || 0,
                influencer.match_count || 0,
                influencer.trending || 0,
                `"${(influencer.platforms || '').replace(/"/g, '""')}"`,
                `"${(influencer.auth_platforms || '').replace(/"/g, '""')}"`,
                influencer.detailed_data_fetched ? 'Yes' : 'No'
            ].join(','))
        ].join('\n');

        fs.writeFileSync(filename, csvContent);
        console.log(`✓ Data saved to ${filename}`);
    }

    saveSimplified(filename = 'influencers_instagram_detailed.csv') {
        const csvContent = [
            'Name,Instagram URL,Instagram Username,Instagram User ID,Instagram Followers,Categories,Location,Detailed Data',
            ...this.allInfluencers.map(inf => [
                `"${(inf.name || '').replace(/"/g, '""')}"`,
                inf.instagram_url || '',
                inf.instagram_username || '',
                inf.instagram_user_id || '',
                inf.instagram_followers || 0,
                `"${(inf.categories || '').replace(/"/g, '""')}"`,
                `"${(inf.location || '').replace(/"/g, '""')}"`,
                inf.detailed_data_fetched ? 'Yes' : 'No'
            ].join(','))
        ].join('\n');

        fs.writeFileSync(filename, csvContent);
        console.log(`✓ Instagram-focused data saved to ${filename}`);
    }

    printSampleData(count = 3) {
        console.log(`\n--- Sample Data (first ${count} influencers) ---`);
        this.allInfluencers.slice(0, count).forEach((inf, index) => {
            console.log(`\n${index + 1}. ${inf.name}`);
            console.log(`   Instagram: ${inf.instagram_url || 'N/A'}`);
            console.log(`   Instagram Username: ${inf.instagram_username || 'N/A'}`);
            console.log(`   Instagram User ID: ${inf.instagram_user_id || 'N/A'}`);
            console.log(`   Instagram Followers: ${inf.instagram_followers}`);
            console.log(`   Categories: ${inf.categories || 'N/A'}`);
            console.log(`   Location: ${inf.location || 'N/A'}`);
            console.log(`   Total Followers: ${inf.total_followers}`);
            console.log(`   Detailed Data Fetched: ${inf.detailed_data_fetched ? 'Yes' : 'No'}`);
        });
    }
}

// Main execution
async function main() {
    const scraper = new GleweeInfluencerScraper();
    
    try {
        console.log('🚀 Starting Enhanced Glewee Influencer Scraper...');
        console.log('This version fetches detailed Instagram data from individual profiles');
        console.log('Note: Progress will be saved every 10 pages\n');
        
        // Ask user if they want detailed profile fetching (you can set this to true by default)
        const fetchDetailed = true; // Set to false if you want to skip detailed fetching
        
        // Start scraping
        await scraper.scrapeAllInfluencers(fetchDetailed);
        
        if (scraper.allInfluencers.length > 0) {
            // Show sample data
            scraper.printSampleData(3);
            
            // Save data in multiple formats
            scraper.saveToJSON();
            scraper.saveToCSV();
            scraper.saveSimplified();
            
            console.log('\n🎉 All done! Check the generated files:');
            console.log('- glewee_influencers_detailed.json (complete data with Instagram details)');
            console.log('- glewee_influencers_detailed.csv (complete data with Instagram details)');
            console.log('- influencers_instagram_detailed.csv (Instagram-focused data)');
        } else {
            console.log('❌ No data was collected. Check your network connection or API access.');
        }
        
    } catch (error) {
        console.error('❌ Scraping failed:', error);
        
        // Try to save whatever data was collected
        if (scraper.allInfluencers.length > 0) {
            console.log(`Saving ${scraper.allInfluencers.length} influencers collected before error...`);
            scraper.saveSimplified('partial_influencers_detailed.csv');
        }
    }
}

// Handle process interruption (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\n⚠️  Process interrupted. Saving collected data...');
    process.exit();
});

// Run the scraper
console.log('Enhanced Glewee Influencer Scraper v3.0');
console.log('=======================================\n');
main();
const axios = require('axios');

class InstagramService {
    constructor() {
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.userId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    }

    async getLatestPosts(limit = 6) {
        try {
            const response = await axios.get(
                `https://graph.instagram.com/v12.0/${this.userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${this.accessToken}&limit=${limit}`
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching Instagram posts:', error);
            return [];
        }
    }
}

module.exports = new InstagramService();
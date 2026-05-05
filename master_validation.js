const mongoose = require('mongoose');
const axios = require('axios');
const AnalyticsLog = require('./models/AnalyticsLog');
const RevenueStats = require('./models/RevenueStats');

const MONGO_URI = 'mongodb://127.0.0.1:27017/share_auto_prototype';

async function runMasterValidation() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- Master Validation (Module 10 Integration) ---');

        console.log('\n1. Fetching Admin Overview...');
        const overviewRes = await axios.get('http://localhost:3010/api/admin/overview');
        console.log('Overview:', overviewRes.data);

        console.log('\n2. Fetching Analytics Logs...');
        const logsRes = await axios.get('http://localhost:3010/api/analytics/logs?limit=5');
        console.log('Recent Logs:', logsRes.data.map(l => ({ type: l.type, time: l.timestamp })));

        console.log('\n✅ Validation script connected successfully. Ensure earlier simulation flows populated the logs.');
    } catch (error) {
        console.error('Validation failed:', error.message);
        if (error.response) console.log(error.response.data);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

runMasterValidation();

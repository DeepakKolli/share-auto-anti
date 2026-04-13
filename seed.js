const mongoose = require('mongoose');
const Route = require('./models/Route');
const Stop = require('./models/Stop');
const AutoAssignment = require('./models/AutoAssignment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';

// ─── Vizag Route Data ───────────────────────────────────────

const vizagRoutes = [
    {
        routeId: 'RT-NAD-GAJ',
        routeName: 'NAD X Road → Gajuwaka',
        distanceKm: 8.5
    },
    {
        routeId: 'RT-MDL-RTC',
        routeName: 'Maddilapalem → RTC Complex',
        distanceKm: 5.0
    },
    {
        routeId: 'RT-MVP-RKB',
        routeName: 'MVP Colony → RK Beach',
        distanceKm: 4.2
    }
];

const vizagStops = [
    // Route 1: NAD X Road → Gajuwaka
    { stopId: 'ST-NAD-01', routeId: 'RT-NAD-GAJ', stopName: 'NAD X Road',    sequenceNumber: 1, distanceKm: 0,   isMajorHub: true },
    { stopId: 'ST-NAD-02', routeId: 'RT-NAD-GAJ', stopName: 'BHPV',          sequenceNumber: 2, distanceKm: 2.5, isMajorHub: true },
    { stopId: 'ST-NAD-03', routeId: 'RT-NAD-GAJ', stopName: 'Auto Nagar',    sequenceNumber: 3, distanceKm: 5.0, isMajorHub: false },
    { stopId: 'ST-NAD-04', routeId: 'RT-NAD-GAJ', stopName: 'Gajuwaka',      sequenceNumber: 4, distanceKm: 8.5, isMajorHub: true },

    // Route 2: Maddilapalem → RTC Complex
    { stopId: 'ST-MDL-01', routeId: 'RT-MDL-RTC', stopName: 'Maddilapalem',      sequenceNumber: 1, distanceKm: 0,   isMajorHub: true },
    { stopId: 'ST-MDL-02', routeId: 'RT-MDL-RTC', stopName: 'Swarna Bharathi',   sequenceNumber: 2, distanceKm: 2.0, isMajorHub: false },
    { stopId: 'ST-MDL-03', routeId: 'RT-MDL-RTC', stopName: 'RTC Complex',       sequenceNumber: 3, distanceKm: 5.0, isMajorHub: true },

    // Route 3: MVP Colony → RK Beach
    { stopId: 'ST-MVP-01', routeId: 'RT-MVP-RKB', stopName: 'MVP Circle',    sequenceNumber: 1, distanceKm: 0,   isMajorHub: true },
    { stopId: 'ST-MVP-02', routeId: 'RT-MVP-RKB', stopName: 'Lawsons Bay',   sequenceNumber: 2, distanceKm: 1.5, isMajorHub: false },
    { stopId: 'ST-MVP-03', routeId: 'RT-MVP-RKB', stopName: 'Tenneti Park',  sequenceNumber: 3, distanceKm: 3.0, isMajorHub: true },
    { stopId: 'ST-MVP-04', routeId: 'RT-MVP-RKB', stopName: 'RK Beach',      sequenceNumber: 4, distanceKm: 4.2, isMajorHub: true }
];

const sampleAssignments = [
    { driverName: 'Raju',  autoNumber: 'AP-31-AB-1234', routeId: 'RT-NAD-GAJ', direction: 'UP',   status: 'WAITING' },
    { driverName: 'Suresh', autoNumber: 'AP-31-CD-5678', routeId: 'RT-NAD-GAJ', direction: 'DOWN', status: 'EN_ROUTE' },
    { driverName: 'Venkat', autoNumber: 'AP-31-EF-9012', routeId: 'RT-MVP-RKB', direction: 'UP',   status: 'WAITING' },
    { driverName: 'Prasad', autoNumber: 'AP-31-GH-3456', routeId: 'RT-MDL-RTC', direction: 'UP',   status: 'WAITING' }
];

// ─── Seed Execution ─────────────────────────────────────────

async function seedDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`[SEED] Connected to DB: ${MONGODB_URI}`);

        // Clean all three collections
        console.log('[SEED] Clearing existing Module 2 data...');
        await Route.deleteMany({});
        await Stop.deleteMany({});
        await AutoAssignment.deleteMany({});

        // Insert routes
        console.log('[SEED] Inserting Vizag routes...');
        await Route.insertMany(vizagRoutes);
        console.log(`       ✓ ${vizagRoutes.length} routes inserted`);

        // Insert stops (separate collection)
        console.log('[SEED] Inserting stops (separate collection)...');
        await Stop.insertMany(vizagStops);
        console.log(`       ✓ ${vizagStops.length} stops inserted`);

        // Insert auto assignments
        console.log('[SEED] Inserting sample auto assignments...');
        await AutoAssignment.insertMany(sampleAssignments);
        console.log(`       ✓ ${sampleAssignments.length} assignments inserted`);

        console.log('\n[SEED] ✅ Database seeding complete!');
        console.log('[SEED] Routes:', vizagRoutes.map(r => r.routeName).join(', '));
        process.exit(0);
    } catch (error) {
        console.error('[SEED Error]', error);
        process.exit(1);
    }
}

seedDB();

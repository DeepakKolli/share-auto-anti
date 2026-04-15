const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Route = require('./models/Route');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/share_auto_prototype';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB for seeding...');

        // Clear existing drivers/routes to avoid duplicates in this silo
        await Driver.deleteMany({});
        await Route.deleteMany({});

        // 1. Seed Routes (Synchronized with Module 3)
        const routes = [
            { routeId: 'R101', routeName: 'NAD -> Gajuwaka', capacity: 3 },
            { routeId: 'R102', routeName: 'Maddilapalem -> RTC Complex', capacity: 4 },
            { routeId: 'R103', routeName: 'MVP Colony -> RK Beach', capacity: 3 }
        ];
        await Route.insertMany(routes);
        console.log('Routes seeded.');

        // 2. Seed a Sample Driver
        const hashedPassword = await bcrypt.hash('driver123', 10);
        await Driver.create({
            name: 'Ravi Kumar',
            phone: '8887776660',
            password: hashedPassword,
            vehicleNumber: 'AP 31 TV 1234',
            vehicleType: 'auto',
            licenseNumber: 'DL-VZ-001',
            isAvailable: true,
            isOnline: false,
            currentRoute: 'R101' // Defaulting to one route for testing
        });
        console.log('Sample driver created: 8887776660 / driver123');

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();

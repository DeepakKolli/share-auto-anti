const mongoose = require('mongoose');
const Route = require('./models/Route');
const Stop = require('./models/Stop');
const AutoAssignment = require('./models/AutoAssignment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/share_auto_prototype';

async function runSimulation() {
    console.log("=== STARTING MODULE 2: ROUTE MANAGEMENT SIMULATION ===\n");

    await mongoose.connect(MONGODB_URI);
    console.log("[Setup] Connected to MongoDB\n");

    // ─── SCENARIO 1: Fetch All Routes ───────────────────────
    console.log("--- SCENARIO 1: Fetch All Active Routes ---");
    const routes = await Route.find({ isActive: true }).sort('routeName');
    console.log(`[Result] Found ${routes.length} active routes:`);
    routes.forEach(r => console.log(`   • ${r.routeId} → ${r.routeName} (${r.distanceKm} km)`));

    // ─── SCENARIO 2: Get Stops For a Route ──────────────────
    console.log("\n--- SCENARIO 2: Get Ordered Stops for 'RT-NAD-GAJ' ---");
    const nadStops = await Stop.find({ routeId: 'RT-NAD-GAJ' }).sort('sequenceNumber');
    console.log(`[Result] ${nadStops.length} stops:`);
    nadStops.forEach(s => console.log(`   ${s.sequenceNumber}. ${s.stopName} (${s.stopId}) — ${s.distanceKm}km`));

    // ─── SCENARIO 3: Validate Stop Order (UP Direction) ─────
    console.log("\n--- SCENARIO 3: Validate Stop Order (UP — BHPV → Gajuwaka) ---");
    const origin = await Stop.findOne({ stopId: 'ST-NAD-02' }); // BHPV (seq 2)
    const dest = await Stop.findOne({ stopId: 'ST-NAD-04' });   // Gajuwaka (seq 4)
    const upValid = origin.sequenceNumber < dest.sequenceNumber;
    console.log(`[Result] Origin: ${origin.stopName} (seq ${origin.sequenceNumber})`);
    console.log(`         Dest:   ${dest.stopName} (seq ${dest.sequenceNumber})`);
    console.log(`         Direction: UP → Valid: ${upValid ? '✅ YES' : '❌ NO'}`);

    // ─── SCENARIO 4: Validate Stop Order (DOWN Direction) ───
    console.log("\n--- SCENARIO 4: Validate Stop Order (DOWN — Gajuwaka → BHPV) ---");
    const downValid = dest.sequenceNumber > origin.sequenceNumber;
    console.log(`[Result] Origin: ${dest.stopName} (seq ${dest.sequenceNumber})`);
    console.log(`         Dest:   ${origin.stopName} (seq ${origin.sequenceNumber})`);
    console.log(`         Direction: DOWN → Valid: ${downValid ? '✅ YES' : '❌ NO'}`);

    // ─── SCENARIO 5: Duplicate Route Prevention ─────────────
    console.log("\n--- SCENARIO 5: Prevent Duplicate Route ---");
    try {
        const duplicate = new Route({ routeId: 'RT-NAD-GAJ', routeName: 'Duplicate Test' });
        await duplicate.save();
        console.log("[Result] ❌ Duplicate was allowed (unexpected!)");
    } catch (err) {
        console.log(`[Result] ✅ Duplicate correctly blocked: ${err.message.substring(0, 80)}...`);
    }

    // ─── SCENARIO 6: Query Active Autos on Route ────────────
    console.log("\n--- SCENARIO 6: Get Active Autos on RT-NAD-GAJ ---");
    const autos = await AutoAssignment.find({ routeId: 'RT-NAD-GAJ', status: { $ne: 'OFF_DUTY' } });
    console.log(`[Result] ${autos.length} active autos:`);
    autos.forEach(a => console.log(`   • ${a.driverName} (${a.autoNumber}) — ${a.direction} — Status: ${a.status}`));

    // ─── SCENARIO 7: Filter by Direction ────────────────────
    console.log("\n--- SCENARIO 7: Get Autos on RT-NAD-GAJ Direction=UP ---");
    const upAutos = await AutoAssignment.find({ routeId: 'RT-NAD-GAJ', direction: 'UP', status: { $ne: 'OFF_DUTY' } });
    console.log(`[Result] ${upAutos.length} UP autos:`);
    upAutos.forEach(a => console.log(`   • ${a.driverName} (${a.autoNumber}) — Status: ${a.status}`));

    // ─── SCENARIO 8: Pooling Integration Data ───────────────
    console.log("\n--- SCENARIO 8: Build Pooling Payload (Module 1 Integration) ---");
    console.log("[Simulating] User selects: RT-MVP-RKB, from MVP Circle to Tenneti Park, direction UP");
    const poolOrigin = await Stop.findOne({ stopId: 'ST-MVP-01' });
    const poolDest = await Stop.findOne({ stopId: 'ST-MVP-03' });
    const poolingPayload = {
        routeId: 'RT-MVP-RKB',
        originSequence: poolOrigin.sequenceNumber,
        destinationSequence: poolDest.sequenceNumber,
        direction: 'UP'
    };
    console.log(`[Result] Payload for Module 1 Pooling Engine:`);
    console.log(`         ${JSON.stringify(poolingPayload, null, 2)}`);
    console.log(`         ✅ Module 1 can now match: any user where start ≥ ${poolOrigin.sequenceNumber} AND end ≤ ${poolDest.sequenceNumber}`);

    // ─── SCENARIO 9: Update Auto Status ─────────────────────
    console.log("\n--- SCENARIO 9: Update Auto Status (Raju starts route) ---");
    const updated = await AutoAssignment.findOneAndUpdate(
        { autoNumber: 'AP-31-AB-1234' },
        { $set: { status: 'EN_ROUTE', currentStopIndex: 1 } },
        { new: true }
    );
    console.log(`[Result] ${updated.driverName} → Status: ${updated.status}, At Stop Index: ${updated.currentStopIndex}`);

    console.log("\n=== SIMULATION COMPLETE ===");
    process.exit(0);
}

runSimulation().catch(err => {
    console.error("Simulation failed:", err);
    process.exit(1);
});

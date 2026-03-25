document.addEventListener('DOMContentLoaded', () => {
    // Online/Offline Toggle logic
    const toggle = document.getElementById('statusToggle');
    const statusText = document.querySelector('.status-text');
    const poolSection = document.getElementById('poolSection');

    toggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            statusText.innerText = 'Online';
            poolSection.style.opacity = '1';
            poolSection.style.pointerEvents = 'auto';
            startSimulation();
        } else {
            statusText.innerText = 'Offline';
            poolSection.style.opacity = '0.5';
            poolSection.style.pointerEvents = 'none';
            stopSimulation();
        }
    });

    startSimulation(); // Start on load
});

let simInterval;
let seatsFilled = 2; // Initial state: 2 seats already booked by Suresh (+1)

function startSimulation() {
    stopSimulation(); // clear any existing

    const passengerNames = ['Rahul', 'Priya', 'Kiran', 'Anita'];
    
    simInterval = setInterval(() => {
        if(seatsFilled < 4) {
            seatsFilled++;
            
            const pList = document.getElementById('passengerList');
            const randomName = passengerNames[Math.floor(Math.random() * passengerNames.length)];
            
            // Create new passenger element
            const newPassenger = document.createElement('div');
            newPassenger.className = 'passenger-item new';
            newPassenger.innerHTML = `
                <div class="p-info">
                    <div class="p-avatar bg-primary text-black"><i class="fa-solid fa-user"></i></div>
                    <div>
                        <div class="font-semibold text-sm">${randomName} (1 Seat)</div>
                        <div class="text-xs text-muted">Pick: RTC Complex</div>
                    </div>
                </div>
                <div class="p-status ready">Just Booked</div>
            `;
            
            pList.appendChild(newPassenger);
            
            // Update counts
            document.getElementById('seatsFilled').innerText = seatsFilled;
            
            const waitingMsg = document.getElementById('waitingMsg');
            if(seatsFilled === 4) {
                waitingMsg.innerHTML = '<i class="fa-solid fa-check text-green-400"></i> Auto is Full!';
                waitingMsg.className = 'text-center text-sm text-green-400 mt-3 font-bold';
                
                // Enable Start Trip Button
                const startBtn = document.getElementById('startBtn');
                startBtn.classList.add('ready');
                startBtn.disabled = false;
                startBtn.innerText = 'Start Trip (₹160 Expected)';
                startBtn.onclick = startTrip;
                
                stopSimulation();
            } else {
                waitingMsg.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Waiting for ${4 - seatsFilled} more passenger(s)...`;
            }
        }
    }, 3500); // Add a passenger every 3.5 seconds
}

function stopSimulation() {
    if(simInterval) clearInterval(simInterval);
}

function startTrip() {
    const startBtn = document.getElementById('startBtn');
    startBtn.innerText = 'Trip in Progress...';
    startBtn.style.background = 'var(--accent-blue)';
    startBtn.style.borderColor = 'var(--accent-blue)';
    
    // Simulate Trip completion
    setTimeout(() => {
        alert('Trip Completed! ₹160 added to your wallet.');
        
        // Reset for next route
        document.getElementById('total-earnings').innerText = parseInt(document.getElementById('total-earnings').innerText) + 160;
        
        // Minor reset
        seatsFilled = 0;
        document.getElementById('seatsFilled').innerText = '0';
        document.getElementById('passengerList').innerHTML = '';
        
        const waitingMsg = document.getElementById('waitingMsg');
        waitingMsg.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Waiting for 4 more passenger(s)...`;
        waitingMsg.className = 'text-center text-xs text-muted mt-3';
        
        startBtn.classList.remove('ready');
        startBtn.disabled = true;
        startBtn.innerText = 'Start Trip';
        startBtn.style.background = '';
        startBtn.style.borderColor = '';
        startBtn.onclick = null;
        
        startSimulation(); // Restart the hunt for passengers
        
    }, 3000);
}

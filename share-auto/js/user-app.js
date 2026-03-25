let seats = 1;
let rideType = 'wait';
const baseWaitPrice = 30;
const baseInstantPrice = 150;

function updateSeats(change) {
    const newSeats = seats + change;
    if (newSeats >= 1 && newSeats <= 4) {
        seats = newSeats;
        document.getElementById('seatCount').innerText = seats;
        updatePricing();
        
        // If 4 seats, force instant ride since auto is full
        if (seats === 4) {
            selectRideType('instant', document.querySelectorAll('.ride-type-card')[1], true);
            document.querySelectorAll('.ride-type-card')[0].style.opacity = '0.5';
            document.querySelectorAll('.ride-type-card')[0].style.pointerEvents = 'none';
        } else {
            document.querySelectorAll('.ride-type-card')[0].style.opacity = '1';
            document.querySelectorAll('.ride-type-card')[0].style.pointerEvents = 'auto';
        }
    }
}

function selectRideType(type, element, forced = false) {
    if (seats === 4 && type === 'wait' && !forced) {
        return;
    }

    rideType = type;
    
    document.querySelectorAll('.ride-type-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    
    updatePricing();
}

function updatePricing() {
    const waitTotal = baseWaitPrice * seats;
    const instantTotal = baseInstantPrice;

    document.getElementById('price-wait').innerText = waitTotal;
    document.getElementById('price-instant').innerText = instantTotal;
    
    document.getElementById('btn-price').innerText = rideType === 'wait' ? waitTotal : instantTotal;
}

// Pooling Simulation
let poolSimulationInterval;

function confirmBooking() {
    document.getElementById('booking-flow').style.display = 'none';
    document.getElementById('live-pool-screen').style.display = 'flex';
    
    const poolContainer = document.getElementById('live-pool-avatars');
    poolContainer.innerHTML = '';
    
    let currentFilled = seats;
    
    for(let i=0; i<4; i++) {
        if (i < seats) {
            poolContainer.innerHTML += `<div class="avatar filled"><i class="fa-solid fa-user"></i></div>`;
        } else {
            poolContainer.innerHTML += `<div class="avatar empty animate-pulse"><i class="fa-solid fa-user-plus"></i></div>`;
        }
    }
    
    updatePoolStatusUI(currentFilled);

    if (rideType === 'instant' || seats === 4) {
        document.getElementById('pool-title').innerText = 'Locating Driver...';
        document.getElementById('pool-subtitle').innerText = 'Contacting nearby driver for your instant ride.';
        setTimeout(() => {
            rideConfirmed();
        }, 1500);
        return;
    }

    // Simulate others joining
    poolSimulationInterval = setInterval(() => {
        if (currentFilled < 4 && Math.random() > 0.3) {
            currentFilled++;
            
            const avatars = poolContainer.children;
            for(let i=0; i<4; i++) {
                if (i < currentFilled) {
                    avatars[i].className = 'avatar filled jump-anim';
                    avatars[i].innerHTML = '<i class="fa-solid fa-user"></i>';
                }
            }
            
            updatePoolStatusUI(currentFilled);
            
            if (currentFilled === 4) {
                clearInterval(poolSimulationInterval);
                setTimeout(rideConfirmed, 1500);
            }
        }
    }, 2000);
}

function updatePoolStatusUI(count) {
    document.getElementById('live-pool-count').innerText = `${count}/4 Filled`;
    const msg = document.getElementById('pool-status-msg');
    
    if (count === 4) {
        msg.innerText = "Auto is full! Assigning driver...";
        msg.className = "text-xs text-green-400 mt-3 text-center font-bold";
    } else {
        msg.innerText = `${count} passenger(s) in pool. Waiting for ${4-count} more...`;
    }
}

function rideConfirmed() {
    document.querySelector('.pulse-ring').innerHTML = '<i class="fa-solid fa-check text-green-400"></i>';
    document.querySelector('.pulse-ring').style.background = 'rgba(74, 222, 128, 0.2)';
    document.querySelector('.pulse-ring').style.animation = 'none';
    document.querySelector('.pulse-ring::before') && (document.querySelector('.pulse-ring::before').style.display = 'none');
    
    document.getElementById('pool-title').innerText = 'Ride Confirmed!';
    document.getElementById('pool-subtitle').innerText = 'Driver Ramesh (AP31 TT 1234) is arriving in 2 mins.';
    
    const cancelBtn = document.querySelector('#live-pool-screen .btn-secondary');
    cancelBtn.innerText = 'Go to Driver App Demo';
    cancelBtn.classList.remove('btn-secondary');
    cancelBtn.classList.add('btn-primary');
    cancelBtn.onclick = function() {
        window.location.href = 'driver-app.html';
    };
}

function cancelBooking() {
    clearInterval(poolSimulationInterval);
    document.getElementById('booking-flow').style.display = 'flex';
    document.getElementById('live-pool-screen').style.display = 'none';
    // Reset pulse ring
    document.querySelector('.pulse-ring').innerHTML = '<i class="fa-solid fa-users"></i>';
    document.querySelector('.pulse-ring').style.background = 'rgba(255, 209, 0, 0.2)';
    
    document.getElementById('pool-title').innerText = 'Finding Co-Passengers...';
    document.getElementById('pool-subtitle').innerText = 'Matching you with others heading the same way to save you money.';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes jump {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.15); box-shadow: 0 10px 20px rgba(255, 209, 0, 0.5); }
        100% { transform: translateY(0) scale(1); }
    }
    .jump-anim {
        animation: jump 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
`;
document.head.appendChild(style);

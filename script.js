document.addEventListener('DOMContentLoaded', () => {

    const bubblesLayer = document.getElementById('bubbles-layer');
    const emailInput   = document.getElementById('email-input');
    const scene        = document.querySelector('.scene');

    const platforms = [
        'openai',
        'anthropic',
        'tinder',
        'whatsapp',
        'snapchat',
        'google',
        'discord',
        'telegram',
        'instagram',
        'x',
        'meta',
        'linkedin',
        'reddit',
        'twitch',
        'facebook',
        'netflix',
    ];

    /* -------------------------------------------------------
       Focused state: fade bubbles so they don't block typing
    ------------------------------------------------------- */
    emailInput.addEventListener('focus', () => {
        document.body.classList.add('input-focused');
    });
    emailInput.addEventListener('blur', () => {
        document.body.classList.remove('input-focused');
    });

    /* -------------------------------------------------------
       Get the spawn point from the ACTUAL pot element rect
       so bubbles always emerge from the mouth of the cauldron
    ------------------------------------------------------- */
    function getSpawnRect() {
        const potClip = document.querySelector('.pot-clip');
        if (!potClip) {
            return {
                centerX: window.innerWidth / 2,
                top: window.innerHeight - 200,
                width: 120,
            };
        }
        const r = potClip.getBoundingClientRect();
        // Spawn from the very top of the visible pot (the cauldron mouth/opening)
        return {
            centerX: r.left + r.width / 2,
            top:     r.top + 10,            // just above the rim
            width:   r.width * 0.5,         // spread across 50% of pot width
        };
    }

    function createBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Size
        const size = Math.random() * 34 + 44; // 44–78px
        bubble.style.width  = `${size}px`;
        bubble.style.height = `${size}px`;

        // Spawn from fluid surface of the pot
        const spawn = getSpawnRect();
        const spawnX = spawn.centerX - spawn.width * 0.3 + Math.random() * spawn.width * 0.6;
        const spawnY = spawn.top - size / 2; // emerge from fluid surface

        bubble.style.left   = `${spawnX - size / 2}px`;
        bubble.style.top    = `${spawnY}px`;

        // Slight horizontal drift during float
        const drift = (Math.random() - 0.5) * 80; // ±40px
        bubble.style.setProperty('--drift', `${drift}px`);

        // Duration
        const duration = Math.random() * 4 + 5; // 5–9s
        bubble.style.animationDuration = `${duration}s`;

        // Platform logo
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const img = document.createElement('img');
        img.src     = `https://cdn.simpleicons.org/${platform}/ffffff`;
        img.alt     = platform;
        img.loading = 'lazy';
        bubble.appendChild(img);

        bubblesLayer.appendChild(bubble);

        // Cleanup
        setTimeout(() => bubble.remove(), duration * 1000 + 300);
    }

    // Stagger first wave of logo bubbles
    for (let i = 0; i < 7; i++) {
        setTimeout(createBubble, i * 500);
    }

    // Ongoing streams managed by visibility API

    /* -------------------------------------------------------
       Dynamic Vapor Streaks
    ------------------------------------------------------- */
    function createVapor() {
        const vapor = document.createElement('div');
        vapor.classList.add('vapor-streak');

        // Shape: elongated
        const width = Math.random() * 60 + 40; // 40-100px
        const height = Math.random() * 15 + 10; // 10-25px
        vapor.style.width  = `${width}px`;
        vapor.style.height = `${height}px`;

        const spawn = getSpawnRect();
        const spawnX = spawn.centerX - spawn.width * 0.3 + Math.random() * spawn.width * 0.6;
        const spawnY = spawn.top - 10; // Slightly above rim

        vapor.style.left   = `${spawnX - width / 2}px`;
        vapor.style.top    = `${spawnY}px`;

        const drift = (Math.random() - 0.5) * 60; // horizontal drift
        vapor.style.setProperty('--drift', `${drift}px`);

        const duration = Math.random() * 2 + 3; // 3-5s
        vapor.style.animationDuration = `${duration}s`;

        bubblesLayer.appendChild(vapor);

        setTimeout(() => vapor.remove(), duration * 1000);
    }

    // Vapor interval managed by visibility API

    /* -------------------------------------------------------
       Small Surface Boiling Bubbles
    ------------------------------------------------------- */
    function createSurfaceBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add('surface-bubble');

        // Size (small)
        const size = Math.random() * 8 + 4; // 4–12px
        bubble.style.width  = `${size}px`;
        bubble.style.height = `${size}px`;

        const spawn = getSpawnRect();
        // Spread wider across the surface
        const spawnX = spawn.centerX - spawn.width * 0.4 + Math.random() * spawn.width * 0.8;
        const spawnY = spawn.top - 5 + Math.random() * 10; // slightly above/below rim

        bubble.style.left   = `${spawnX - size / 2}px`;
        bubble.style.top    = `${spawnY}px`;

        const drift = (Math.random() - 0.5) * 20; 
        bubble.style.setProperty('--drift', `${drift}px`);

        const duration = Math.random() * 0.8 + 0.6; // 0.6 - 1.4s
        bubble.style.animationDuration = `${duration}s`;

        bubblesLayer.appendChild(bubble);

        setTimeout(() => bubble.remove(), duration * 1000);
    }

    let bubbleInterval, vaporInterval, surfaceInterval;

    function startIntervals() {
        if (document.hidden) return;
        if (!bubbleInterval) bubbleInterval = setInterval(createBubble, 1000);
        if (!vaporInterval) vaporInterval = setInterval(createVapor, 400);
        if (!surfaceInterval) surfaceInterval = setInterval(createSurfaceBubble, 150);
    }

    function stopIntervals() {
        clearInterval(bubbleInterval); bubbleInterval = null;
        clearInterval(vaporInterval); vaporInterval = null;
        clearInterval(surfaceInterval); surfaceInterval = null;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopIntervals();
        } else {
            startIntervals();
        }
    });

    // Start initially if visible
    startIntervals();
});

/* ---------------------------------------------------------
   Form submission
--------------------------------------------------------- */
async function handleSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('email-input');
    const btn   = document.getElementById('notify-btn');
    const msg   = document.getElementById('form-message');

    const email = input.value.trim();
    if (!email) return;

    btn.disabled    = true;
    btn.textContent = 'Sending...';

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            btn.textContent = 'You\'re on the list ✓';
            btn.style.background = '#16a34a'; // Green
            msg.textContent = 'Awesome! We\'ll let you know when we launch.';
            msg.style.color = '#16a34a';
            input.value = '';
        } else if (response.status === 409 || data.error === 'already_subscribed') {
            btn.textContent = 'Already Subscribed';
            btn.style.background = '#ca8a04'; // Yellow
            msg.textContent = 'Looks like you are already on the list!';
            msg.style.color = '#ca8a04';
        } else {
            throw new Error(data.error || 'Failed to subscribe');
        }
    } catch (err) {
        console.error('Subscription error:', err);
        btn.textContent = 'Error';
        btn.style.background = '#dc2626'; // Red
        msg.textContent = 'Something went wrong. Please try again.';
        msg.style.color = '#dc2626';
    }

    setTimeout(() => {
        btn.disabled    = false;
        btn.textContent = 'Notify Me';
        btn.style.background = '';
        msg.textContent = 'No spam. Just a heads-up when we launch.';
        msg.style.color = '';
    }, 4500);
}

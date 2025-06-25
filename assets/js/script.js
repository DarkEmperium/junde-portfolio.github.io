document.addEventListener('DOMContentLoaded', () => {

    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const backgroundMusic = document.getElementById('background-music');
    
    // This variable now correctly reflects the initial state set in the HTML
    let isMusicPlaying = false;


    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        root.classList.toggle('dark');
    });
    
    // --- Background Music Toggle (FIXED & ROBUST) ---
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up

        // On the first click, Tone.start() is essential to unblock the browser's audio context
        Tone.start(); 
        
        isMusicPlaying = !isMusicPlaying;

        if (isMusicPlaying) {
            musicToggle.classList.remove('muted');
            // .play() returns a Promise. We should handle it correctly.
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Music playback was prevented.", error);
                    // If playback fails, reset the state
                    isMusicPlaying = false;
                    musicToggle.classList.add('muted');
                });
            }
        } else {
            musicToggle.classList.add('muted');
            backgroundMusic.pause();
        }
    });

    // --- Sound Effect ---
    function playClickSound() {
        const clickSound = document.getElementById('click-sound');
        clickSound.currentTime = 0; // Reset to the start for rapid clicks
        clickSound.play();
    }

    document.querySelectorAll('.icon, .theme-toggle, .music-toggle').forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('click', playClickSound);
    });

    // --- GitHub Repo Fetching ---
    async function fetchRepos(container) {
        const username = 'DarkEmperium';
        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            const repos = await response.json();

            container.innerHTML = ''; // Clear loading message
            repos.forEach(repo => {
                const repoCard = document.createElement('div');
                repoCard.className = 'p-3 rounded-xl project-card';
                repoCard.innerHTML = `
                            <h3 class="font-bold text-lg">${repo.name}</h3>
                            <p class="text-sm mt-1">${repo.description || 'No description available.'}</p>
                            <a href="${repo.html_url}" target="_blank" class="accent text-sm font-bold hover:underline mt-2 inline-block">View on GitHub &rarr;</a>
                        `;
                container.appendChild(repoCard);
            });
        } catch (error) {
            container.innerHTML = `<div class="p-3 rounded-xl project-card">Could not fetch projects. ${error.message}</div>`;
        }
    }

    // --- Window Management (Final Robust Version) ---
    let highestZIndex = 10;

    function makeDraggable(windowEl) {
        if (windowEl.id === 'main-window') return;
        const header = windowEl.querySelector('.window-header');

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.control-btn')) return;
            e.preventDefault();

            let draggedElement = windowEl;
            let offsetX = e.clientX - draggedElement.offsetLeft;
            let offsetY = e.clientY - draggedElement.offsetTop;

            highestZIndex++;
            draggedElement.style.zIndex = highestZIndex;
            draggedElement.style.transition = 'none';
            document.body.style.userSelect = 'none';

            function onMouseMove(moveEvent) {
                moveEvent.preventDefault();

                // Restrict dragging within the viewport
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const elementWidth = draggedElement.offsetWidth;
                const elementHeight = draggedElement.offsetHeight;

                let newLeft = moveEvent.clientX - offsetX;
                let newTop = moveEvent.clientY - offsetY;

                // Prevent dragging out of bounds
                newLeft = Math.max(0, Math.min(viewportWidth - elementWidth, newLeft));
                newTop = Math.max(0, Math.min(viewportHeight - elementHeight, newTop));

                draggedElement.style.left = `${newLeft}px`;
                draggedElement.style.top = `${newTop}px`;
            }

            function onMouseUp() {
                if (draggedElement) {
                    draggedElement.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    document.body.style.userSelect = 'auto';
                }
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    function openWindow(templateId) {
        const windowId = `window-${templateId.replace('template-', '')}`;
        const existingWindow = document.getElementById(windowId);

        if (existingWindow) {
            existingWindow.classList.remove('shake');
            void existingWindow.offsetWidth;
            existingWindow.classList.add('shake');
            return;
        }

        const template = document.getElementById(templateId);
        if (!template) return;
        const windowNode = template.content.firstElementChild.cloneNode(true);

        highestZIndex++;
        windowNode.style.zIndex = highestZIndex;

        document.body.appendChild(windowNode);
        requestAnimationFrame(() => { windowNode.classList.add('open'); });
        makeDraggable(windowNode);

        // If it's the FAQ window, setup the accordion
        if (windowId === 'window-faq') {
            const faqQuestions = windowNode.querySelectorAll('.faq-question');
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const answer = question.nextElementSibling;
                    question.classList.toggle('active');

                    if (question.classList.contains('active')) {
                        answer.style.maxHeight = answer.scrollHeight + 'px';
                    } else {
                        answer.style.maxHeight = null;
                    }
                });
            });
        }

        // If it's the projects window, fetch repos
        if (windowId === 'window-projects') {
            const projectsContainer = windowNode.querySelector('#projects-container');
            fetchRepos(projectsContainer);
        }

        const closeBtn = windowNode.querySelector('.close-btn');
        closeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playClickSound();
            windowNode.classList.add('closing');
            windowNode.classList.remove('open');
            windowNode.addEventListener('transitionend', () => { windowNode.remove(); }, { once: true });
        });
    }

    document.getElementById('open-about').addEventListener('click', () => openWindow('template-about'));
    document.getElementById('open-projects').addEventListener('click', () => openWindow('template-projects'));
    document.getElementById('open-contact').addEventListener('click', () => openWindow('template-contact'));
    document.getElementById('open-faq').addEventListener('click', () => openWindow('template-faq'));
    document.getElementById('open-downloads').addEventListener('click', () => openWindow('template-downloads'));

    document.getElementById('main-window').style.zIndex = 5;
});

document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    document.getElementById('currentYear').textContent = currentYear;
});

document.getElementById('open-faq').addEventListener('click', () => openWindow('template-faq'));
document.getElementById('open-downloads').addEventListener('click', () => openWindow('template-downloads'));
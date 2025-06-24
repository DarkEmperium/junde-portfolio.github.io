document.addEventListener('DOMContentLoaded', () => {

    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        root.classList.toggle('dark');
    });

    // --- Sound Effect ---
    let synth;
    function initAudio() { if (!synth) { synth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 } }).toDestination(); } }
    function playClickSound() { initAudio(); synth.triggerAttackRelease('A5', '16n'); }

    document.querySelectorAll('.icon, .theme-toggle').forEach(el => {
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

                draggedElement.style.left = `${moveEvent.clientX - offsetX}px`;
                draggedElement.style.top = `${moveEvent.clientY - offsetY}px`;
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
            return; dddd
        }

        const template = document.getElementById(templateId);
        if (!template) return;
        const windowNode = template.content.firstElementChild.cloneNode(true);

        highestZIndex++;
        windowNode.style.zIndex = highestZIndex;

        document.body.appendChild(windowNode);
        requestAnimationFrame(() => { windowNode.classList.add('open'); });
        makeDraggable(windowNode);

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

    document.getElementById('main-window').style.zIndex = 5;
});
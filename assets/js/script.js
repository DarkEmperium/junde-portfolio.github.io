document.addEventListener('DOMContentLoaded', () => {

    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const lightModeSound = document.getElementById('light-mode-sound');
    const darkModeSound = document.getElementById('dark-mode-sound');
    const backgroundMusic = document.getElementById('background-music');

    lightModeSound.volume = 0.1;
    darkModeSound.volume = 0.1;
    let isMusicPlaying = false;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    });

    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();

        root.classList.toggle('dark');

        if (root.classList.contains('dark')) {
            if (darkModeSound) {
                darkModeSound.currentTime = 0;
                darkModeSound.play();
            }
        } else {
            if (lightModeSound) {
                lightModeSound.currentTime = 0;
                lightModeSound.play();
            }
        }
    });

    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        Tone.start(); 
        
        isMusicPlaying = !isMusicPlaying;

        if (isMusicPlaying) {
            musicToggle.classList.remove('muted');
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Music playback was prevented.", error);
                    isMusicPlaying = false;
                    musicToggle.classList.add('muted');
                });
            }
        } else {
            musicToggle.classList.add('muted');
            backgroundMusic.pause();
        }
    });

    function playClickSound() {
        const clickSound = document.getElementById('click-sound');
        clickSound.currentTime = 0;
        clickSound.play();
    }

    function playFlipSound() {
        const flipSound = document.getElementById('flip-sound');
        flipSound.currentTime = 0;
        flipSound.play();
    }

    function copyToClipboard(text, element) {
        navigator.clipboard.writeText(text).then(() => {
            element.classList.add('copied');
            setTimeout(() => {
                element.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed To Copy : ', err);
        });
    }

    document.querySelectorAll('.icon, .music-toggle').forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('click', playClickSound);
    });

    async function fetchRepos(container) {
        const username = 'DarkEmperium';
        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            const repos = await response.json();

            container.innerHTML = '';
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

    let highestZIndex = 10;

    function makeDraggable(windowEl) {
        if (windowEl.id === 'main-window') return;
        const header = windowEl.querySelector('.window-header');

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.control-btn')) return;
            e.preventDefault();

            let draggedElement = windowEl;
            
            const rect = draggedElement.getBoundingClientRect();

            let offsetX = e.clientX - rect.left;
            let offsetY = e.clientY - rect.top;

            highestZIndex++;
            draggedElement.style.zIndex = highestZIndex;
            draggedElement.style.transition = 'none';
            document.body.style.userSelect = 'none';

            draggedElement.style.left = rect.left + 'px';
            draggedElement.style.top = rect.top + 'px';
            draggedElement.style.transform = 'none';


            function onMouseMove(moveEvent) {
                moveEvent.preventDefault();

                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const elementWidth = draggedElement.offsetWidth;
                const elementHeight = draggedElement.offsetHeight;

                let newLeft = moveEvent.clientX - offsetX;
                let newTop = moveEvent.clientY - offsetY;

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

        if (windowId === 'window-faq') {
            const faqQuestions = windowNode.querySelectorAll('.faq-question');
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    playFlipSound();
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

        if (windowId === 'window-projects') {
            const projectsContainer = windowNode.querySelector('#projects-container');
            fetchRepos(projectsContainer);
        }

        if (windowId === 'window-contact') {
            const copyEmailLink = windowNode.querySelector('#copy-email-link');
            if (copyEmailLink) {
                copyEmailLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    playClickSound();
                    const email = 'jundechua2003@gmail.com';
                    copyToClipboard(email, copyEmailLink);
                });
            }
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
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = currentYear;
    }
});
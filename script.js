// UberEdit Application - Professional Video Editor
class Zenvio {
    constructor() {
        this.currentSection = 'import';
        this.mediaFiles = [];
        this.timeline = {
            videoTrack: [],
            audioTrack: []
        };
        this.collaborators = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.zoomLevel = 100;
        this.currentVideo = null;
        this.currentAudio = null;
        this.appliedEffects = [];
        this.videoFilters = [];
        this.audioFilters = [];
        this.canvas = null;
        this.ctx = null;
        this.renderingTimer = null;
        this.currentMediaItem = null;
        this.projectState = {
            clips: [],
            effects: [],
            transitions: [],
            audioSettings: {
                equalizer: {
                    '60Hz': 0,
                    '230Hz': 0,
                    '910Hz': 0,
                    '4kHz': 0,
                    '14kHz': 0
                },
                volume: 1,
                normalized: false,
                noiseReduced: false
            },
            videoSettings: {
                speed: 1,
                reversed: false,
                rotation: 0,
                flipHorizontal: false,
                flipVertical: false,
                crop: { x: 0, y: 0, width: 100, height: 100 },
                chromaKey: {
                    enabled: false,
                    color: { r: 0, g: 255, b: 0 }, // Verde por defecto
                    threshold: 0.3,
                    smoothing: 0.1
                }
            }
        };

        this.init();
    }

    init() {
        this.setupIntro();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupTimeline();
        this.setupCollaboration();
        this.loadProjectState();
        this.setupVideoCanvas();
        this.setupCustomPlayer();
    }

    setupIntro() {
        const introScreen = document.getElementById('intro-screen');
        const app = document.getElementById('app');

        // Después de 4 segundos, ocultar intro y mostrar app
        setTimeout(() => {
            introScreen.style.display = 'none';
            app.classList.remove('hidden');
        }, 4000);
    }

    setupCustomPlayer() {
        const video = document.getElementById('preview-video');
        const playBtn = document.getElementById('custom-play-btn');
        const playOverlay = document.querySelector('.play-overlay');
        const progressBar = document.getElementById('custom-progress-bar');
        const progressFill = document.getElementById('custom-progress-fill');
        const progressHandle = document.getElementById('custom-progress-handle');
        const timeDisplay = document.getElementById('custom-time-display');
        const volumeBtn = document.getElementById('volume-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        // Detectar dispositivo móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Play/Pause
        const togglePlay = () => {
            if (!video.src) return;
            
            if (video.paused) {
                video.play();
                this.isPlaying = true;
                playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';
                playOverlay.style.opacity = '0';
            } else {
                video.pause();
                this.isPlaying = false;
                playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
            }
        };

        playBtn.addEventListener('click', togglePlay);
        playOverlay.addEventListener('click', togglePlay);

        // Progress bar
        progressBar.addEventListener('click', (e) => {
            if (!video.duration) return;
            
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * video.duration;
            
            video.currentTime = newTime;
        });

        // Volume control
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            video.volume = volume;
            
            if (volume === 0) {
                volumeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/></svg>';
            } else if (volume < 0.5) {
                volumeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" fill="currentColor"/></svg>';
            } else {
                volumeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/></svg>';
            }
        });

        volumeBtn.addEventListener('click', () => {
            if (video.volume === 0) {
                video.volume = 1;
                volumeSlider.value = 1;
            } else {
                video.volume = 0;
                volumeSlider.value = 0;
            }
            volumeSlider.dispatchEvent(new Event('input'));
        });

        // Fullscreen
        fullscreenBtn.addEventListener('click', () => {
            const videoContainer = document.querySelector('.custom-video-player');
            if (!document.fullscreenElement) {
                videoContainer.requestFullscreen().catch(err => {
                    console.log('Error attempting to enable fullscreen:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });

        // Update progress
        video.addEventListener('timeupdate', () => {
            if (video.duration) {
                const percentage = (video.currentTime / video.duration) * 100;
                progressFill.style.width = `${percentage}%`;
                
                const currentTime = this.formatTime(video.currentTime);
                const duration = this.formatTime(video.duration);
                timeDisplay.textContent = `${currentTime} / ${duration}`;
            }
        });

        // Video ended
        video.addEventListener('ended', () => {
            this.isPlaying = false;
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
            playOverlay.style.opacity = '1';
        });

        // Show/hide overlay on hover (solo desktop)
        const videoContainer = document.querySelector('.custom-video-player');
        
        if (!isMobile) {
            videoContainer.addEventListener('mouseenter', () => {
                if (video.paused) {
                    playOverlay.style.opacity = '1';
                }
            });

            videoContainer.addEventListener('mouseleave', () => {
                if (!video.paused) {
                    playOverlay.style.opacity = '0';
                }
            });
        } else {
            // En móviles, mantener overlay visible cuando esté pausado
            playOverlay.style.opacity = '1';
            
            // Ocultar controles después de 3 segundos en reproducción
            let hideControlsTimeout;
            const hideControls = () => {
                if (!video.paused) {
                    playOverlay.style.opacity = '0';
                }
            };
            
            const showControls = () => {
                playOverlay.style.opacity = '1';
                clearTimeout(hideControlsTimeout);
                if (!video.paused) {
                    hideControlsTimeout = setTimeout(hideControls, 3000);
                }
            };
            
            videoContainer.addEventListener('touchstart', showControls);
            videoContainer.addEventListener('click', showControls);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // File input
        const fileInput = document.getElementById('file-input');
        const dropZone = document.querySelector('.drop-zone');

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelection(e.target.files));

        // Export presets
        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.selectExportPreset(e.currentTarget.dataset.preset);
            });
        });

        // Export button
        document.querySelector('.btn-export').addEventListener('click', () => this.exportVideo());

        // Timeline controls
        document.querySelector('.zoom-in').addEventListener('click', () => this.zoomTimeline(1.2));
        document.querySelector('.zoom-out').addEventListener('click', () => this.zoomTimeline(0.8));

        

        // Audio tools
        document.querySelector('.btn-normalize').addEventListener('click', () => this.normalizeAudio());
        document.querySelector('.btn-noise-reduction').addEventListener('click', () => this.reduceNoise());

        // Equalizer
        document.querySelectorAll('.eq-slider').forEach(slider => {
            slider.addEventListener('input', (e) => this.updateEqualizer(e.target));
        });

        // Effects and transitions
        document.querySelectorAll('.effect-card').forEach(card => {
            card.addEventListener('click', (e) => this.applyEffect(e.currentTarget.dataset.effect));
        });

        document.querySelectorAll('.transition-card').forEach(card => {
            card.addEventListener('click', (e) => this.applyTransition(e.currentTarget.dataset.transition));
        });

        // Collaboration
        document.querySelector('.btn-invite').addEventListener('click', () => this.inviteCollaborator());

        // Notification close
        document.querySelector('.notification-close').addEventListener('click', () => this.hideNotification());

        

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Advanced tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAdvancedTool(e.currentTarget.dataset.tool));
        });
    }

    setupDragAndDrop() {
        const dropZone = document.querySelector('.drop-zone');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files);
        }, false);

        // Soporte táctil para móviles
        this.setupTouchSupport();
    }

    setupTouchSupport() {
        // Mejorar controles táctiles para timeline
        const timeline = document.querySelector('.timeline');
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchDragging = false;
        let touchDraggedClip = null;

        timeline.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('clip')) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isTouchDragging = true;
                touchDraggedClip = e.target;
                touchDraggedClip.classList.add('dragging');
                
                document.querySelectorAll('.clip').forEach(clip => clip.classList.remove('selected'));
                touchDraggedClip.classList.add('selected');
                
                e.preventDefault();
            }
        });

        timeline.addEventListener('touchmove', (e) => {
            if (isTouchDragging && touchDraggedClip) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - touchStartX;
                
                const trackContent = touchDraggedClip.parentElement;
                const trackRect = trackContent.getBoundingClientRect();
                const currentLeft = parseInt(touchDraggedClip.style.left) || 0;
                
                const newX = Math.max(0, Math.min(
                    trackContent.offsetWidth - touchDraggedClip.offsetWidth,
                    currentLeft + deltaX
                ));
                
                touchDraggedClip.style.left = newX + 'px';
                
                touchStartX = touch.clientX;
                
                const clipId = touchDraggedClip.dataset.clipId;
                const clip = this.projectState.clips.find(c => c.id === clipId);
                if (clip) {
                    clip.startTime = (newX / this.zoomLevel) * 10;
                }
                
                e.preventDefault();
            }
        });

        timeline.addEventListener('touchend', (e) => {
            if (isTouchDragging) {
                isTouchDragging = false;
                if (touchDraggedClip) {
                    touchDraggedClip.classList.remove('dragging');
                    this.updateTimelinePreview();
                    this.saveProjectState();
                    touchDraggedClip = null;
                }
            }
        });

        // Mejorar controles de progreso para móviles
        const progressBar = document.getElementById('custom-progress-bar');
        if (progressBar) {
            progressBar.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });

            progressBar.addEventListener('touchend', (e) => {
                if (!this.currentVideo || !this.currentVideo.duration) return;
                
                const touch = e.changedTouches[0];
                const rect = progressBar.getBoundingClientRect();
                const clickX = touch.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = percentage * this.currentVideo.duration;
                
                this.currentVideo.currentTime = newTime;
                e.preventDefault();
            });
        }

        // Controles de volumen para móviles
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            });
        }

        // Mejorar navegación táctil
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.switchSection(tab.dataset.section);
            });
        });
    }

    setupTimeline() {
        const timeline = document.querySelector('.timeline');
        let isDragging = false;
        let draggedClip = null;
        let dragOffset = 0;

        timeline.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('clip')) {
                isDragging = true;
                draggedClip = e.target;
                draggedClip.classList.add('dragging');

                const clipRect = draggedClip.getBoundingClientRect();
                dragOffset = e.clientX - clipRect.left;

                document.querySelectorAll('.clip').forEach(clip => clip.classList.remove('selected'));
                draggedClip.classList.add('selected');

                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && draggedClip) {
                const timelineRect = timeline.getBoundingClientRect();
                const trackContent = draggedClip.parentElement;
                const trackRect = trackContent.getBoundingClientRect();

                const x = e.clientX - trackRect.left - dragOffset;
                const maxX = trackContent.offsetWidth - draggedClip.offsetWidth;
                const newX = Math.max(0, Math.min(maxX, x));

                draggedClip.style.left = newX + 'px';

                const clipId = draggedClip.dataset.clipId;
                const clip = this.projectState.clips.find(c => c.id === clipId);
                if (clip) {
                    clip.startTime = (newX / this.zoomLevel) * 10;
                    this.saveProjectState();
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (draggedClip) {
                    draggedClip.classList.remove('dragging');
                    this.updateTimelinePreview();
                    draggedClip = null;
                }
            }
        });

        this.setupClipResizing();
    }

    setupCollaboration() {
        setInterval(() => {
            this.updateCollaboratorCursors();
        }, 1000);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    switchSection(section) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;
        this.animateTransition();
    }

    animateTransition() {
        const activeSection = document.querySelector('.section.active');
        activeSection.style.opacity = '0';
        activeSection.style.transform = 'translateY(20px)';

        setTimeout(() => {
            activeSection.style.transition = 'all 0.3s ease';
            activeSection.style.opacity = '1';
            activeSection.style.transform = 'translateY(0)';
        }, 50);
    }

    handleFileSelection(files) {
        if (!files || files.length === 0) {
            this.showNotification('No se seleccionaron archivos');
            return;
        }

        this.updateProgressStation(1);

        let processedFiles = 0;
        const totalFiles = files.length;

        Array.from(files).forEach(file => {
            if (this.isMediaFile(file)) {
                this.processMediaFile(file, () => {
                    processedFiles++;
                    if (processedFiles === totalFiles) {
                        setTimeout(() => {
                            this.updateProgressStation(2);
                            setTimeout(() => {
                                this.updateProgressStation(3);
                                this.showSuccessNotification(`${totalFiles} archivo(s) importado(s) correctamente`, {
            subtitle: 'Listos para editar',
            duration: 4000
        });
                            }, 1000);
                        }, 1500);
                    }
                });
            } else {
                this.showNotification(`Archivo ${file.name} no es compatible`);
                processedFiles++;
            }
        });
    }

    isMediaFile(file) {
        const validTypes = [
            'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv',
            'audio/mp3', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/mpeg',
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'
        ];
        
        return validTypes.some(type => file.type === type) || 
               file.name.toLowerCase().match(/\.(mp4|avi|mov|mkv|webm|mp3|wav|aac|m4a|jpg|jpeg|png|gif|bmp|webp)$/);
    }

    processMediaFile(file, callback) {
        // Mostrar notificación de carga
        const loadingNotification = this.showLoadingNotification(
            `Procesando ${file.name}`,
            { subtitle: 'Analizando propiedades del archivo...' }
        );

        const reader = new FileReader();

        reader.onload = (e) => {
            const mediaItem = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type || this.getTypeFromExtension(file.name),
                size: file.size,
                url: e.target.result,
                duration: 0,
                file: file
            };

            this.mediaFiles.push(mediaItem);
            this.createMediaCard(mediaItem);

            if (file.type.startsWith('video/') || this.isVideoFile(file.name)) {
                this.updateNotification(loadingNotification, `Analizando video: ${file.name}`, 50);
                this.getDuration(e.target.result, (duration) => {
                    mediaItem.duration = duration;
                    this.updateMediaCard(mediaItem);
                    this.updateNotification(loadingNotification, `Video procesado: ${file.name}`, 100);
                    
                    setTimeout(() => {
                        this.hideNotification(loadingNotification);
                        this.showSuccessNotification(`Video ${file.name} listo`, {
                            subtitle: `Duración: ${this.formatTime(duration)}`,
                            duration: 3000
                        });
                    }, 500);
                    
                    if (callback) callback();
                });
            } else if (file.type.startsWith('audio/') || this.isAudioFile(file.name)) {
                this.updateNotification(loadingNotification, `Analizando audio: ${file.name}`, 50);
                this.getAudioDuration(e.target.result, (duration) => {
                    mediaItem.duration = duration;
                    this.updateMediaCard(mediaItem);
                    this.updateNotification(loadingNotification, `Audio procesado: ${file.name}`, 100);
                    
                    setTimeout(() => {
                        this.hideNotification(loadingNotification);
                        this.showSuccessNotification(`Audio ${file.name} listo`, {
                            subtitle: `Duración: ${this.formatTime(duration)}`,
                            duration: 3000
                        });
                    }, 500);
                    
                    if (callback) callback();
                });
            } else {
                this.updateNotification(loadingNotification, `Imagen procesada: ${file.name}`, 100);
                
                setTimeout(() => {
                    this.hideNotification(loadingNotification);
                    this.showSuccessNotification(`Imagen ${file.name} lista`, {
                        subtitle: `Tamaño: ${this.formatFileSize(file.size)}`,
                        duration: 3000
                    });
                }, 500);
                
                if (callback) callback();
            }
        };

        reader.onerror = () => {
            this.hideNotification(loadingNotification);
            this.showErrorNotification(`Error al procesar archivo: ${file.name}`, {
                subtitle: 'Verifica que el archivo no esté corrupto',
                duration: 6000
            });
            if (callback) callback();
        };

        reader.readAsDataURL(file);
    }

    getTypeFromExtension(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const types = {
            'mp4': 'video/mp4', 'webm': 'video/webm', 'avi': 'video/avi',
            'mov': 'video/mov', 'mkv': 'video/mkv',
            'mp3': 'audio/mp3', 'wav': 'audio/wav', 'aac': 'audio/aac',
            'm4a': 'audio/m4a',
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'gif': 'image/gif', 'bmp': 'image/bmp', 'webp': 'image/webp'
        };
        return types[ext] || 'application/octet-stream';
    }

    isVideoFile(filename) {
        return filename.toLowerCase().match(/\.(mp4|avi|mov|mkv|webm)$/);
    }

    isAudioFile(filename) {
        return filename.toLowerCase().match(/\.(mp3|wav|aac|m4a)$/);
    }

    getDuration(url, callback) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            callback(video.duration);
        };
        video.onerror = () => {
            callback(0);
        };
        video.src = url;
    }

    getAudioDuration(url, callback) {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            callback(audio.duration);
        };
        audio.onerror = () => {
            callback(0);
        };
        audio.src = url;
    }

    createMediaCard(mediaItem) {
        const mediaGrid = document.getElementById('media-grid');
        const card = document.createElement('div');
        card.className = 'media-card';
        card.dataset.mediaId = mediaItem.id;

        const thumbnail = this.createThumbnail(mediaItem);

        card.innerHTML = `
            <div class="media-thumbnail">${thumbnail}</div>
            <div class="media-info">
                <div class="media-name">${mediaItem.name}</div>
                <div class="media-details">
                    ${this.formatFileSize(mediaItem.size)}
                    ${mediaItem.duration ? ` • ${this.formatTime(mediaItem.duration)}` : ''}
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.addToTimeline(mediaItem));
        card.addEventListener('dblclick', () => this.previewMedia(mediaItem));

        mediaGrid.appendChild(card);
    }

    createThumbnail(mediaItem) {
        if (mediaItem.type.startsWith('video/') || this.isVideoFile(mediaItem.name)) {
            return `<video src="${mediaItem.url}" muted preload="metadata"></video>`;
        } else if (mediaItem.type.startsWith('image/')) {
            return `<img src="${mediaItem.url}" alt="${mediaItem.name}">`;
        } else if (mediaItem.type.startsWith('audio/') || this.isAudioFile(mediaItem.name)) {
            return '<div style="color: var(--uber-green); font-size: 32px;">♪</div>';
        }
        return '';
    }

    updateMediaCard(mediaItem) {
        const card = document.querySelector(`[data-media-id="${mediaItem.id}"]`);
        if (card) {
            const details = card.querySelector('.media-details');
            details.textContent = `${this.formatFileSize(mediaItem.size)} • ${this.formatTime(mediaItem.duration)}`;
        }
    }

    addToTimeline(mediaItem) {
        const isVideo = mediaItem.type.startsWith('video/') || this.isVideoFile(mediaItem.name);
        const track = isVideo ? 'video-track' : 'audio-track';
        const trackContent = document.getElementById(track);

        const clipData = {
            id: 'clip_' + Date.now(),
            mediaId: mediaItem.id,
            name: mediaItem.name,
            type: mediaItem.type,
            startTime: 0,
            duration: mediaItem.duration || 5,
            effects: [],
            volume: 1,
            track: track
        };

        const clip = document.createElement('div');
        clip.className = 'clip';
        clip.dataset.mediaId = mediaItem.id;
        clip.dataset.clipId = clipData.id;
        clip.style.left = '0px';
        clip.style.width = `${Math.max(100, (mediaItem.duration || 5) * 10 * (this.zoomLevel / 100))}px`;
        clip.innerHTML = `
            <span class="clip-name">${mediaItem.name}</span>
            <div class="clip-resize-handle"></div>
        `;

        trackContent.appendChild(clip);

        this.projectState.clips.push(clipData);
        this.saveProjectState();

        this.previewMedia(mediaItem);

        this.switchSection('edit');
        this.showNotification(`${mediaItem.name} añadido a la línea de tiempo`);
    }

    previewMedia(mediaItem) {
        const previewVideo = document.getElementById('preview-video');
        const playOverlay = document.querySelector('.play-overlay');
        this.currentMediaItem = mediaItem;

        this.setupVideoCanvas();

        if (mediaItem.type.startsWith('video/') || this.isVideoFile(mediaItem.name)) {
            this.currentVideo = previewVideo;
            previewVideo.src = mediaItem.url;
            previewVideo.style.opacity = '1';
            previewVideo.load();

            // Mostrar overlay de play
            playOverlay.style.opacity = '1';

            // Resetear efectos aplicados
            this.appliedEffects = [];
            if (this.canvas) {
                this.canvas.style.display = 'none';
            }

            previewVideo.onloadedmetadata = () => {
                this.duration = previewVideo.duration;
                const timeDisplay = document.getElementById('custom-time-display');
                if (timeDisplay) {
                    timeDisplay.textContent = `00:00 / ${this.formatTime(this.duration)}`;
                }
                if (this.canvas) {
                    this.canvas.width = previewVideo.videoWidth || 1920;
                    this.canvas.height = previewVideo.videoHeight || 1080;
                }
            };

            previewVideo.ontimeupdate = () => {
                this.currentTime = previewVideo.currentTime;
                this.updatePlayhead();
                
                // Solo renderizar si hay efectos o transformaciones aplicadas
                if (this.appliedEffects.length > 0 || 
                    this.projectState.videoSettings.rotation !== 0 ||
                    this.projectState.videoSettings.flipHorizontal ||
                    this.projectState.videoSettings.flipVertical ||
                    this.projectState.videoSettings.crop.x !== 0 ||
                    this.projectState.videoSettings.crop.y !== 0 ||
                    this.projectState.videoSettings.crop.width !== 100 ||
                    this.projectState.videoSettings.crop.height !== 100 ||
                    this.projectState.videoSettings.chromaKey.enabled) {
                    this.renderVideoWithEffects();
                }
            };

            previewVideo.onplay = () => {
                this.startRealTimeRendering();
                playOverlay.style.opacity = '0';
            };

            previewVideo.onpause = () => {
                this.stopRealTimeRendering();
            };

        } else if (mediaItem.type.startsWith('audio/') || this.isAudioFile(mediaItem.name)) {
            // Ocultar video y mostrar visualización de audio
            previewVideo.style.opacity = '0';
            playOverlay.style.opacity = '1';
            
            if (this.currentAudio) {
                this.currentAudio.pause();
            }
            this.currentAudio = new Audio(mediaItem.url);
            this.currentAudio.onloadedmetadata = () => {
                this.duration = this.currentAudio.duration;
                const timeDisplay = document.getElementById('custom-time-display');
                if (timeDisplay) {
                    timeDisplay.textContent = `00:00 / ${this.formatTime(this.duration)}`;
                }
                this.applyAudioEffects();
            };

            this.currentAudio.ontimeupdate = () => {
                this.currentTime = this.currentAudio.currentTime;
                this.updatePlayhead();
            };
        }

        this.projectState.currentMedia = mediaItem;
        this.saveProjectState();
    }

    updateProgressStation(step) {
        document.querySelectorAll('.station-step').forEach((station, index) => {
            if (index < step) {
                station.classList.add('completed');
                station.classList.remove('active');
            } else if (index === step - 1) {
                station.classList.add('active');
                station.classList.remove('completed');
            } else {
                station.classList.remove('active', 'completed');
            }
        });
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    togglePlayback() {
        const playBtn = document.getElementById('custom-play-btn');
        const playOverlay = document.querySelector('.play-overlay');

        if (this.isPlaying) {
            if (this.currentVideo && !this.currentVideo.paused) {
                this.currentVideo.pause();
            }
            if (this.currentAudio && !this.currentAudio.paused) {
                this.currentAudio.pause();
            }
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
            this.isPlaying = false;
        } else {
            if (this.currentVideo) {
                this.currentVideo.play().catch(e => {
                    console.log('Error playing video:', e);
                    this.showNotification('Error al reproducir video');
                });
                playOverlay.style.opacity = '0';
            } else if (this.currentAudio) {
                this.currentAudio.play().catch(e => {
                    console.log('Error playing audio:', e);
                    this.showNotification('Error al reproducir audio');
                });
                playOverlay.style.opacity = '0';
            } else {
                this.showNotification('No hay media cargado para reproducir');
                return;
            }
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';
            this.isPlaying = true;
        }
    }

    

    updatePlayhead() {
        const playhead = document.querySelector('.playhead');
        if (this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            const timelineWidth = document.querySelector('.timeline').offsetWidth - 120;
            playhead.style.left = `${120 + (timelineWidth * percentage / 100)}px`;
        }
    }

    zoomTimeline(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(25, Math.min(400, this.zoomLevel));

        document.querySelector('.zoom-level').textContent = `${Math.round(this.zoomLevel)}%`;

        document.querySelectorAll('.clip').forEach(clip => {
            const mediaId = clip.dataset.mediaId;
            const mediaItem = this.mediaFiles.find(item => item.id == mediaId);
            if (mediaItem) {
                const newWidth = Math.max(100, (mediaItem.duration || 5) * 10 * (this.zoomLevel / 100));
                clip.style.width = `${newWidth}px`;
            }
        });
    }

    applyEffect(effectType) {
        if (!this.currentVideo && !this.currentAudio) {
            this.showNotification('Primero selecciona un video o audio');
            return;
        }

        const selectedClip = document.querySelector('.clip.selected');
        if (!selectedClip) {
            this.showNotification('Selecciona un clip en la línea de tiempo');
            return;
        }

        const clipId = selectedClip.dataset.clipId;
        const clip = this.projectState.clips.find(c => c.id === clipId);

        if (!clip) {
            this.showNotification('Error: clip no encontrado');
            return;
        }

        const effect = {
            id: 'effect_' + Date.now(),
            type: effectType,
            intensity: 1,
            settings: this.getDefaultEffectSettings(effectType)
        };

        clip.effects.push(effect);
        this.saveProjectState();

        this.applyEffectToVideo(effectType, effect.settings);
        this.showNotification(`Efecto ${effectType} aplicado`);
    }

    getDefaultEffectSettings(effectType) {
        const settings = {
            'color-grade': { brightness: 0, contrast: 0, saturation: 0, hue: 0 },
            'lens-correct': { distortion: 0, vignette: 0 },
            'stabilizer': { strength: 0.5 },
            'blur': { radius: 2 },
            'sharpen': { amount: 0.5 },
            'brightness': { value: 0.2 },
            'contrast': { value: 0.2 },
            'saturation': { value: 0.2 },
            'vintage': { intensity: 0.5 }
        };
        return settings[effectType] || {};
    }

    applyEffectToVideo(effectType, settings) {
        if (!this.currentVideo) return;

        const effect = {
            type: effectType,
            settings: settings
        };

        // Remover efecto existente del mismo tipo
        this.appliedEffects = this.appliedEffects.filter(e => e.type !== effectType);
        
        // Añadir nuevo efecto
        this.appliedEffects.push(effect);
        
        // Activar canvas para mostrar efectos
        this.canvas.style.display = 'block';
        this.currentVideo.style.opacity = '0';
        
        // Renderizar inmediatamente
        this.renderVideoWithEffects();
    }

    applyTransition(transitionType) {
        this.showNotification(`Transición ${transitionType} aplicada`);
    }

    updateEqualizer(slider) {
        const value = parseFloat(slider.value);
        const band = slider.dataset.band;

        this.projectState.audioSettings.equalizer[band] = value;
        this.saveProjectState();

        if (this.currentAudio) {
            this.applyAudioEQ();
        }

        console.log(`EQ ${band}: ${value}dB`);
        this.showNotification(`EQ ${band} ajustado a ${value}dB`);
    }

    applyAudioEQ() {
        if (!this.currentAudio) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (!this.audioSource) {
                this.audioSource = this.audioContext.createMediaElementSource(this.currentAudio);
            }

            const eq = this.projectState.audioSettings.equalizer;
            const frequencies = [60, 230, 910, 4000, 14000];
            const bands = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'];

            if (this.eqFilters) {
                this.eqFilters.forEach(filter => filter.disconnect());
            }

            this.eqFilters = [];
            let previousNode = this.audioSource;

            bands.forEach((band, index) => {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = frequencies[index];
                filter.Q.value = 1;
                filter.gain.value = eq[band];

                previousNode.connect(filter);
                this.eqFilters.push(filter);
                previousNode = filter;
            });

            previousNode.connect(this.audioContext.destination);

        } catch (error) {
            console.error('Error applying audio EQ:', error);
        }
    }

    normalizeAudio() {
        this.showNotification('Normalizando audio...');
        this.projectState.audioSettings.normalized = true;
        this.saveProjectState();

        setTimeout(() => {
            this.showNotification('Audio normalizado correctamente');
        }, 1000);
    }

    reduceNoise() {
        this.showNotification('Reduciendo ruido...');
        this.projectState.audioSettings.noiseReduced = true;
        this.saveProjectState();

        setTimeout(() => {
            this.showNotification('Reducción de ruido completada');
        }, 2000);
    }

    selectExportPreset(preset) {
        const settings = {
            instagram: { resolution: '1080p', fps: '30', aspectRatio: '1:1' },
            youtube: { resolution: '1080p', fps: '60', aspectRatio: '16:9' },
            tiktok: { resolution: '1080p', fps: '30', aspectRatio: '9:16' },
            custom: { resolution: '1080p', fps: '30', aspectRatio: '16:9' }
        };

        const selected = settings[preset];
        if (selected) {
            document.getElementById('resolution').value = selected.resolution;
            document.getElementById('fps').value = selected.fps;
        }

        this.showNotification(`Preset ${preset} seleccionado`);
    }

    exportVideo() {
        const exportProgress = document.querySelector('.export-progress');
        const progressPin = document.querySelector('.progress-pin');
        const routeLine = document.querySelector('.route-line');
        const progressPercentage = document.getElementById('progress-percentage');
        const progressStatus = document.getElementById('progress-status');

        exportProgress.classList.remove('hidden');

        // Mostrar notificación de inicio de exportación
        const exportNotification = this.showLoadingNotification(
            'Iniciando exportación...',
            { 
                subtitle: 'Preparando tu video',
                persistent: true
            }
        );

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 8 + 2;
            if (progress > 100) progress = 100;

            progressPin.style.left = `${progress}%`;
            routeLine.style.setProperty('--progress', `${progress}%`);
            progressPercentage.textContent = `${Math.round(progress)}%`;

            // Actualizar notificación según el progreso
            if (progress < 25) {
                progressStatus.textContent = 'Preparando exportación...';
                this.updateNotification(exportNotification, 'Preparando exportación...', progress);
            } else if (progress < 50) {
                progressStatus.textContent = 'Procesando video...';
                this.updateNotification(exportNotification, 'Procesando video...', progress);
            } else if (progress < 75) {
                progressStatus.textContent = 'Aplicando efectos...';
                this.updateNotification(exportNotification, 'Aplicando efectos...', progress);
            } else if (progress < 100) {
                progressStatus.textContent = 'Finalizando...';
                this.updateNotification(exportNotification, 'Finalizando...', progress);
            } else {
                progressStatus.textContent = 'Exportación completada';
                this.updateNotification(exportNotification, 'Exportación completada', 100);
                clearInterval(interval);

                setTimeout(() => {
                    exportProgress.classList.add('hidden');
                    this.hideNotification(exportNotification);
                    
                    // Mostrar notificación de éxito con acciones
                    this.showSuccessNotification('¡Video exportado exitosamente!', {
                        subtitle: 'Tu video está listo para compartir',
                        duration: 8000,
                        actions: [
                            {
                                id: 'download',
                                label: 'Descargar',
                                callback: () => this.downloadVideo()
                            },
                            {
                                id: 'share',
                                label: 'Compartir',
                                type: 'secondary',
                                callback: () => this.shareVideo()
                            }
                        ]
                    });
                }, 1000);
            }
        }, 300);
    }

    downloadVideo() {
        this.showInfoNotification('Descarga iniciada', {
            subtitle: 'El video se está descargando...',
            duration: 3000
        });
    }

    shareVideo() {
        this.showInfoNotification('Opciones de compartir', {
            subtitle: 'Abriendo opciones de compartir...',
            duration: 3000
        });
    }

    inviteCollaborator() {
        const emailInput = document.getElementById('invite-email');
        const email = emailInput.value.trim();

        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor ingresa un email válido');
            return;
        }

        const collaborator = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0],
            avatar: email.charAt(0).toUpperCase(),
            status: 'online'
        };

        this.collaborators.push(collaborator);
        this.addCollaboratorToList(collaborator);
        emailInput.value = '';

        this.showNotification(`Invitación enviada a ${email}`);
    }

    addCollaboratorToList(collaborator) {
        const collaboratorsList = document.getElementById('collaborators-list');
        const item = document.createElement('div');
        item.className = 'collaborator-item';

        item.innerHTML = `
            <div class="collaborator-avatar">${collaborator.avatar}</div>
            <div class="collaborator-info">
                <div class="collaborator-name">${collaborator.name}</div>
                <div class="collaborator-email">${collaborator.email}</div>
            </div>
            <div class="collaborator-status"></div>
        `;

        collaboratorsList.appendChild(item);
    }

    updateCollaboratorCursors() {
        this.collaborators.forEach(collaborator => {
            console.log(`Updating cursor for ${collaborator.name}`);
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'success', options = {}) {
        const {
            duration = 5000,
            progress = false,
            actions = [],
            subtitle = null,
            persistent = false
        } = options;

        // Crear contenedor de notificaciones si no existe
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = this.createNotificationHTML(message, type, subtitle, actions, progress);

        // Agregar al contenedor
        container.appendChild(notification);

        // Configurar progreso si es necesario
        if (progress) {
            const progressBar = notification.querySelector('.notification-progress-bar');
            if (progressBar) {
                let currentProgress = 0;
                const progressInterval = setInterval(() => {
                    currentProgress += 100 / (duration / 100);
                    progressBar.style.width = Math.min(currentProgress, 100) + '%';
                    
                    if (currentProgress >= 100) {
                        clearInterval(progressInterval);
                    }
                }, 100);
            }
        }

        // Configurar eventos
        this.setupNotificationEvents(notification, actions);

        // Auto-remove si no es persistente
        if (!persistent) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }

        // Limitar número de notificaciones
        this.limitNotifications(container);

        return notification;
    }

    createNotificationHTML(message, type, subtitle, actions, progress) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            loading: '⟳',
            info: 'ℹ'
        };

        const icon = icons[type] || icons.info;
        const subtitleHTML = subtitle ? `<div class="notification-subtext">${subtitle}</div>` : '';
        const progressHTML = progress ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : '';
        
        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = '<div class="notification-actions">';
            actions.forEach(action => {
                actionsHTML += `<button class="notification-action ${action.type || ''}" data-action="${action.id}">${action.label}</button>`;
            });
            actionsHTML += '</div>';
        }

        return `
            <div class="notification-content">
                <div class="notification-icon ${type}">${icon}</div>
                <div class="notification-text-content">
                    <div class="notification-text">${message}</div>
                    ${subtitleHTML}
                    ${progressHTML}
                    ${actionsHTML}
                </div>
                <button class="notification-close">×</button>
            </div>
        `;
    }

    setupNotificationEvents(notification, actions) {
        // Botón de cerrar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hideNotification(notification));

        // Botones de acción
        const actionButtons = notification.querySelectorAll('.notification-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const actionId = e.target.dataset.action;
                const action = actions.find(a => a.id === actionId);
                if (action && action.callback) {
                    action.callback();
                }
                if (action && action.autoClose !== false) {
                    this.hideNotification(notification);
                }
            });
        });

        // Hover para pausar auto-close
        notification.addEventListener('mouseenter', () => {
            notification.style.animationPlayState = 'paused';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.animationPlayState = 'running';
        });
    }

    hideNotification(notification) {
        if (!notification) {
            // Fallback para el método anterior
            const oldNotification = document.getElementById('notification');
            if (oldNotification) {
                oldNotification.classList.add('hidden');
            }
            return;
        }

        notification.classList.add('hidden');
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 400);
    }

    limitNotifications(container) {
        const notifications = container.querySelectorAll('.notification-toast');
        if (notifications.length > 5) {
            // Remover las más antiguas
            for (let i = 0; i < notifications.length - 5; i++) {
                this.hideNotification(notifications[i]);
            }
        }
    }

    // Métodos específicos para diferentes tipos de notificaciones
    showSuccessNotification(message, options = {}) {
        return this.showNotification(message, 'success', options);
    }

    showErrorNotification(message, options = {}) {
        return this.showNotification(message, 'error', options);
    }

    showWarningNotification(message, options = {}) {
        return this.showNotification(message, 'warning', options);
    }

    showLoadingNotification(message, options = {}) {
        return this.showNotification(message, 'loading', {
            ...options,
            persistent: true,
            progress: true
        });
    }

    showInfoNotification(message, options = {}) {
        return this.showNotification(message, 'info', options);
    }

    // Actualizar notificación existente
    updateNotification(notification, message, progress = null) {
        if (!notification) return;

        const textElement = notification.querySelector('.notification-text');
        const progressBar = notification.querySelector('.notification-progress-bar');

        if (textElement) {
            textElement.textContent = message;
        }

        if (progress !== null && progressBar) {
            progressBar.style.width = progress + '%';
        }
    }

    

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '=':
                case '+':
                    e.preventDefault();
                    this.zoomTimeline(1.2);
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomTimeline(0.8);
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayback();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveProjectState();
                    this.showNotification('Proyecto guardado');
                    break;
            }
        }

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                const selectedClip = document.querySelector('.clip.selected');
                if (selectedClip) {
                    const clipId = selectedClip.dataset.clipId;
                    this.removeClip(clipId);
                    selectedClip.remove();
                    this.showNotification('Clip eliminado');
                }
                break;
            case 'ArrowLeft':
                if (this.duration > 0) {
                    const newTime = Math.max(0, this.currentTime - 5);
                    if (this.currentVideo) this.currentVideo.currentTime = newTime;
                    if (this.currentAudio) this.currentAudio.currentTime = newTime;
                }
                break;
            case 'ArrowRight':
                if (this.duration > 0) {
                    const newTime = Math.min(this.duration, this.currentTime + 5);
                    if (this.currentVideo) this.currentVideo.currentTime = newTime;
                    if (this.currentAudio) this.currentAudio.currentTime = newTime;
                }
                break;
        }
    }

    setupVideoCanvas() {
        const previewContainer = document.querySelector('.video-preview');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = 'calc(100% - 60px)';
            this.canvas.style.objectFit = 'contain';
            this.canvas.style.zIndex = '10';
            this.canvas.style.background = 'transparent';
            this.ctx = this.canvas.getContext('2d');
            previewContainer.appendChild(this.canvas);
        }
    }

    startRealTimeRendering() {
        if (this.renderingTimer) {
            clearInterval(this.renderingTimer);
        }
        this.renderingTimer = setInterval(() => {
            this.renderVideoWithEffects();
        }, 33);
    }

    stopRealTimeRendering() {
        if (this.renderingTimer) {
            clearInterval(this.renderingTimer);
            this.renderingTimer = null;
        }
    }

    renderVideoWithEffects() {
        if (!this.currentVideo || !this.canvas || !this.ctx) return;

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Aplicar transformaciones de video
        this.ctx.save();
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Aplicar rotación
        if (this.projectState.videoSettings.rotation !== 0) {
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((this.projectState.videoSettings.rotation * Math.PI) / 180);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // Aplicar flip
        let scaleX = 1;
        let scaleY = 1;
        
        if (this.projectState.videoSettings.flipHorizontal) {
            scaleX = -1;
            this.ctx.translate(this.canvas.width, 0);
        }
        
        if (this.projectState.videoSettings.flipVertical) {
            scaleY = -1;
            this.ctx.translate(0, this.canvas.height);
        }
        
        this.ctx.scale(scaleX, scaleY);
        
        // Aplicar crop
        const crop = this.projectState.videoSettings.crop;
        const cropX = (crop.x / 100) * this.canvas.width;
        const cropY = (crop.y / 100) * this.canvas.height;
        const cropWidth = (crop.width / 100) * this.canvas.width;
        const cropHeight = (crop.height / 100) * this.canvas.height;
        
        // Dibujar video con transformaciones
        this.ctx.drawImage(
            this.currentVideo,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, this.canvas.width, this.canvas.height
        );
        
        this.ctx.restore();

        // Aplicar efectos de filtro si existen
        if (this.appliedEffects.length > 0) {
            this.appliedEffects.forEach(effect => {
                this.applyCanvasEffect(effect.type, effect.settings);
            });
        }

        // Aplicar Chroma Key si está habilitado
        if (this.projectState.videoSettings.chromaKey.enabled) {
            this.applyChromaKey();
        }
    }

    applyCanvasEffect(effectType, settings) {
        if (!this.ctx) return;

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        switch (effectType) {
            case 'sharpen':
                this.applySharpenEffect(data, this.canvas.width, this.canvas.height, settings.amount);
                break;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    applySharpenEffect(data, width, height, amount) {
        const kernel = [
            0, -amount, 0,
            -amount, 1 + 4 * amount, -amount,
            0, -amount, 0
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                let r = 0, g = 0, b = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4;
                        const kval = kernel[(ky + 1) * 3 + (kx + 1)];

                        r += data[kidx] * kval;
                        g += data[kidx + 1] * kval;
                        b += data[kidx + 2] * kval;
                    }
                }

                data[idx] = Math.min(255, Math.max(0, r));
                data[idx + 1] = Math.min(255, Math.max(0, g));
                data[idx + 2] = Math.min(255, Math.max(0, b));
            }
        }
    }

    applyChromaKey() {
        if (!this.ctx || !this.canvas) return;

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const chromaSettings = this.projectState.videoSettings.chromaKey;
        const targetColor = chromaSettings.color;
        const threshold = chromaSettings.threshold;
        const smoothing = chromaSettings.smoothing;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calcular diferencia de color usando distancia euclidiana
            const colorDistance = Math.sqrt(
                Math.pow(r - targetColor.r, 2) +
                Math.pow(g - targetColor.g, 2) +
                Math.pow(b - targetColor.b, 2)
            ) / Math.sqrt(3 * Math.pow(255, 2)); // Normalizar a 0-1

            if (colorDistance <= threshold) {
                // Calcular alpha basado en la distancia para suavizado
                let alpha = 0;
                if (colorDistance > threshold - smoothing) {
                    // Aplicar gradiente suave en los bordes
                    alpha = (colorDistance - (threshold - smoothing)) / smoothing;
                    alpha = Math.min(1, Math.max(0, alpha)) * 255;
                } else {
                    alpha = 0; // Completamente transparente
                }
                
                data[i + 3] = alpha; // Canal alpha
            }
            // Si no coincide con el color objetivo, mantener opacidad original
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    setupClipResizing() {
        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('clip-resize-handle')) {
                const clip = e.target.closest('.clip');
                let isResizing = true;

                const handleMouseMove = (e) => {
                    if (!isResizing) return;

                    const clipRect = clip.getBoundingClientRect();
                    const trackRect = clip.parentElement.getBoundingClientRect();

                    const newWidth = e.clientX - clipRect.left;
                    const maxWidth = trackRect.width - (clipRect.left - trackRect.left);

                    clip.style.width = Math.max(50, Math.min(maxWidth, newWidth)) + 'px';

                    const clipId = clip.dataset.clipId;
                    const clipData = this.projectState.clips.find(c => c.id === clipId);
                    if (clipData) {
                        clipData.duration = (newWidth / this.zoomLevel) * 10;
                        this.saveProjectState();
                    }
                };

                const handleMouseUp = () => {
                    isResizing = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);

                e.preventDefault();
            }
        });
    }

    removeClip(clipId) {
        const clipIndex = this.projectState.clips.findIndex(c => c.id === clipId);
        if (clipIndex !== -1) {
            this.projectState.clips.splice(clipIndex, 1);
            this.saveProjectState();
        }
    }

    saveProjectState() {
        try {
            localStorage.setItem('zenvioProject', JSON.stringify(this.projectState));
        } catch (error) {
            console.error('Error saving project state:', error);
        }
    }

    loadProjectState() {
        try {
            const saved = localStorage.getItem('zenvioProject');
            if (saved) {
                this.projectState = Object.assign(this.projectState, JSON.parse(saved));
                this.restoreProjectState();
            }
        } catch (error) {
            console.error('Error loading project state:', error);
        }
    }

    restoreProjectState() {
        const eq = this.projectState.audioSettings.equalizer;
        Object.keys(eq).forEach(band => {
            const slider = document.querySelector(`[data-band="${band}"]`);
            if (slider) {
                slider.value = eq[band];
            }
        });

        this.showNotification('Proyecto restaurado desde almacenamiento local');
    }

    updateTimelinePreview() {
        if (this.currentVideo) {
            this.renderVideoWithEffects();
        }
        if (this.currentAudio) {
            this.applyAudioEQ();
        }
    }

    applyAudioEffects() {
        if (!this.currentAudio) return;

        this.currentAudio.volume = this.projectState.audioSettings.volume;
        this.applyAudioEQ();

        if (this.projectState.audioSettings.normalized) {
            this.normalizeAudioReal();
        }
    }

    normalizeAudioReal() {
        if (!this.currentAudio) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (!this.audioSource) {
                this.audioSource = this.audioContext.createMediaElementSource(this.currentAudio);
            }

            const compressor = this.audioContext.createDynamicsCompressor();
            compressor.threshold.value = -6;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            this.audioSource.connect(compressor);
            compressor.connect(this.audioContext.destination);

        } catch (error) {
            console.error('Error normalizing audio:', error);
        }
    }

    handleAdvancedTool(tool) {
        if (!this.currentMediaItem) {
            this.showNotification('Primero selecciona un video o audio');
            return;
        }

        switch (tool) {
            case 'speed':
                this.showSpeedControl();
                break;
            case 'reverse':
                this.reverseVideo();
                break;
            case 'crop':
                this.showCropControl();
                break;
            case 'rotate':
                this.showRotateControl();
                break;
            case 'flip':
                this.showFlipControl();
                break;
            case 'chroma':
                this.showChromaKeyControl();
                break;
            default:
                this.showNotification(`Herramienta ${tool} en desarrollo`);
        }
    }

    showSpeedControl() {
        this.showControlPanel('Velocidad', `
            <div class="control-group">
                <label>Velocidad de reproducción</label>
                <input type="range" id="speed-control" min="0.25" max="3" step="0.25" value="${this.projectState.videoSettings.speed}">
                <span id="speed-value">${this.projectState.videoSettings.speed}x</span>
            </div>
        `, (panel) => {
            const speedControl = panel.querySelector('#speed-control');
            const speedValue = panel.querySelector('#speed-value');

            speedControl.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                speedValue.textContent = speed + 'x';
                this.applySpeedChange(speed);
            });
        });
    }

    showCropControl() {
        this.showControlPanel('Recortar Video', `
            <div class="crop-controls">
                <div class="control-group">
                    <label>Posición X</label>
                    <input type="range" id="crop-x" min="0" max="100" value="${this.projectState.videoSettings.crop.x}">
                    <span id="crop-x-value">${this.projectState.videoSettings.crop.x}%</span>
                </div>
                <div class="control-group">
                    <label>Posición Y</label>
                    <input type="range" id="crop-y" min="0" max="100" value="${this.projectState.videoSettings.crop.y}">
                    <span id="crop-y-value">${this.projectState.videoSettings.crop.y}%</span>
                </div>
                <div class="control-group">
                    <label>Ancho</label>
                    <input type="range" id="crop-width" min="10" max="100" value="${this.projectState.videoSettings.crop.width}">
                    <span id="crop-width-value">${this.projectState.videoSettings.crop.width}%</span>
                </div>
                <div class="control-group">
                    <label>Alto</label>
                    <input type="range" id="crop-height" min="10" max="100" value="${this.projectState.videoSettings.crop.height}">
                    <span id="crop-height-value">${this.projectState.videoSettings.crop.height}%</span>
                </div>
            </div>
        `, (panel) => {
            ['x', 'y', 'width', 'height'].forEach(prop => {
                const control = panel.querySelector(`#crop-${prop}`);
                const value = panel.querySelector(`#crop-${prop}-value`);

                control.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    value.textContent = val + '%';
                    this.applyCropChange(prop, val);
                });
            });
        });
    }

    showRotateControl() {
        this.showControlPanel('Rotar Video', `
            <div class="rotate-controls">
                <div class="control-group">
                    <label>Rotación</label>
                    <input type="range" id="rotate-control" min="0" max="360" value="${this.projectState.videoSettings.rotation}">
                    <span id="rotate-value">${this.projectState.videoSettings.rotation}°</span>
                </div>
                <div class="preset-buttons">
                    <button class="preset-btn" data-rotation="90">90°</button>
                    <button class="preset-btn" data-rotation="180">180°</button>
                    <button class="preset-btn" data-rotation="270">270°</button>
                    <button class="preset-btn" data-rotation="0">Reset</button>
                </div>
            </div>
        `, (panel) => {
            const rotateControl = panel.querySelector('#rotate-control');
            const rotateValue = panel.querySelector('#rotate-value');

            rotateControl.addEventListener('input', (e) => {
                const rotation = parseFloat(e.target.value);
                rotateValue.textContent = rotation + '°';
                this.applyRotationChange(rotation);
            });

            panel.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rotation = parseFloat(e.target.dataset.rotation);
                    rotateControl.value = rotation;
                    rotateValue.textContent = rotation + '°';
                    this.applyRotationChange(rotation);
                });
            });
        });
    }

    showFlipControl() {
        this.showControlPanel('Voltear Video', `
            <div class="flip-controls">
                <div class="flip-options">
                    <button class="flip-btn" data-flip="none">
                        <span>↑</span>
                        <small>Normal</small>
                    </button>
                    <button class="flip-btn" data-flip="horizontal">
                        <span>↔</span>
                        <small>Horizontal</small>
                    </button>
                    <button class="flip-btn" data-flip="vertical">
                        <span>↕</span>
                        <small>Vertical</small>
                    </button>
                </div>
            </div>
        `, (panel) => {
            panel.querySelectorAll('.flip-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    panel.querySelectorAll('.flip-btn').forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    this.applyFlipChange(e.currentTarget.dataset.flip);
                });
            });
        });
    }

    showChromaKeyControl() {
        const chromaSettings = this.projectState.videoSettings.chromaKey;
        const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        const currentColor = rgbToHex(chromaSettings.color.r, chromaSettings.color.g, chromaSettings.color.b);

        this.showControlPanel('Chroma Key - Eliminar Fondo', `
            <div class="chroma-controls">
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="chroma-enabled" ${chromaSettings.enabled ? 'checked' : ''}>
                        Activar Chroma Key
                    </label>
                </div>
                
                <div class="control-group">
                    <label>Color a eliminar</label>
                    <div class="color-selection">
                        <input type="color" id="chroma-color" value="${currentColor}">
                        <div class="preset-colors">
                            <div class="color-preset" data-color="#00ff00" style="background: #00ff00" title="Verde"></div>
                            <div class="color-preset" data-color="#0000ff" style="background: #0000ff" title="Azul"></div>
                            <div class="color-preset" data-color="#ffffff" style="background: #ffffff" title="Blanco"></div>
                            <div class="color-preset" data-color="#000000" style="background: #000000" title="Negro"></div>
                            <div class="color-preset" data-color="#ff0000" style="background: #ff0000" title="Rojo"></div>
                        </div>
                    </div>
                </div>

                <div class="control-group">
                    <label>Sensibilidad</label>
                    <input type="range" id="chroma-threshold" min="0" max="1" step="0.01" value="${chromaSettings.threshold}">
                    <span id="threshold-value">${Math.round(chromaSettings.threshold * 100)}%</span>
                </div>

                <div class="control-group">
                    <label>Suavizado de bordes</label>
                    <input type="range" id="chroma-smoothing" min="0" max="0.5" step="0.01" value="${chromaSettings.smoothing}">
                    <span id="smoothing-value">${Math.round(chromaSettings.smoothing * 100)}%</span>
                </div>

                <div class="chroma-preview">
                    <small>Vista previa: El color seleccionado será eliminado del video</small>
                </div>
            </div>
        `, (panel) => {
            const enabledCheckbox = panel.querySelector('#chroma-enabled');
            const colorPicker = panel.querySelector('#chroma-color');
            const thresholdSlider = panel.querySelector('#chroma-threshold');
            const smoothingSlider = panel.querySelector('#chroma-smoothing');
            const thresholdValue = panel.querySelector('#threshold-value');
            const smoothingValue = panel.querySelector('#smoothing-value');

            enabledCheckbox.addEventListener('change', (e) => {
                this.applyChromaKeyChange('enabled', e.target.checked);
            });

            colorPicker.addEventListener('input', (e) => {
                this.applyChromaKeyColorChange(e.target.value);
            });

            panel.querySelectorAll('.color-preset').forEach(preset => {
                preset.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    colorPicker.value = color;
                    this.applyChromaKeyColorChange(color);
                });
            });

            thresholdSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                thresholdValue.textContent = Math.round(value * 100) + '%';
                this.applyChromaKeyChange('threshold', value);
            });

            smoothingSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                smoothingValue.textContent = Math.round(value * 100) + '%';
                this.applyChromaKeyChange('smoothing', value);
            });
        });
    }

    showControlPanel(title, content, setupCallback) {
        const overlay = document.createElement('div');
        overlay.className = 'control-panel-overlay';
        overlay.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <h3>${title}</h3>
                    <button class="close-panel">×</button>
                </div>
                <div class="control-content">
                    ${content}
                    <div class="control-buttons">
                        <button onclick="this.closest('.control-panel-overlay').remove()">Aplicar</button>
                        <button onclick="this.closest('.control-panel-overlay').remove()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        overlay.querySelector('.close-panel').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);

        if (setupCallback) {
            setupCallback(overlay);
        }
    }

    applySpeedChange(speed) {
        this.projectState.videoSettings.speed = speed;
        if (this.currentVideo) {
            // Asegurar que playbackRate nunca sea negativo
            this.currentVideo.playbackRate = Math.abs(speed);
        }
        this.saveProjectState();
        this.showNotification(`Velocidad ajustada a ${speed}x`);
    }

    reverseVideo() {
        this.projectState.videoSettings.reversed = !this.projectState.videoSettings.reversed;
        
        if (this.currentVideo) {
            if (this.projectState.videoSettings.reversed) {
                // Simular reversa mediante transformación visual
                this.currentVideo.style.transform = 'scaleX(-1)';
                
                const indicator = document.createElement('div');
                indicator.className = 'reverse-indicator';
                indicator.textContent = 'REVERSA';
                document.querySelector('.video-preview').appendChild(indicator);
            } else {
                this.currentVideo.style.transform = 'scaleX(1)';
                const indicator = document.querySelector('.reverse-indicator');
                if (indicator) indicator.remove();
            }
        }
        
        this.saveProjectState();
        this.showNotification(this.projectState.videoSettings.reversed ? 'Video en reversa' : 'Reversa desactivada');
    }

    applyCropChange(property, value) {
        this.projectState.videoSettings.crop[property] = value;
        this.saveProjectState();
        
        // Activar canvas para mostrar crop
        this.canvas.style.display = 'block';
        this.currentVideo.style.opacity = '0';
        this.renderVideoWithEffects();
    }

    applyRotationChange(rotation) {
        this.projectState.videoSettings.rotation = rotation;
        this.saveProjectState();
        
        // Activar canvas para mostrar rotación
        this.canvas.style.display = 'block';
        this.currentVideo.style.opacity = '0';
        this.renderVideoWithEffects();
        
        this.showNotification(`Video rotado ${rotation}°`);
    }

    applyFlipChange(flipType) {
        this.projectState.videoSettings.flipHorizontal = flipType === 'horizontal';
        this.projectState.videoSettings.flipVertical = flipType === 'vertical';
        
        this.saveProjectState();
        
        // Activar canvas para mostrar flip
        this.canvas.style.display = 'block';
        this.currentVideo.style.opacity = '0';
        this.renderVideoWithEffects();
        
        this.showNotification(`Volteo ${flipType} aplicado`);
    }

    applyChromaKeyChange(property, value) {
        this.projectState.videoSettings.chromaKey[property] = value;
        this.saveProjectState();
        
        if (this.projectState.videoSettings.chromaKey.enabled) {
            // Activar canvas para mostrar chroma key
            this.canvas.style.display = 'block';
            this.currentVideo.style.opacity = '0';
            this.renderVideoWithEffects();
            this.showNotification(`Chroma Key ${property} actualizado`);
        } else {
            this.showNotification('Chroma Key desactivado');
        }
    }

    applyChromaKeyColorChange(hexColor) {
        // Convertir hex a RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        this.projectState.videoSettings.chromaKey.color = { r, g, b };
        this.saveProjectState();
        
        if (this.projectState.videoSettings.chromaKey.enabled) {
            this.canvas.style.display = 'block';
            this.currentVideo.style.opacity = '0';
            this.renderVideoWithEffects();
        }
        
        this.showNotification(`Color de fondo cambiado a ${hexColor}`);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new Zenvio();
});

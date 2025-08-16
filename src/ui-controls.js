class UIControls {
    constructor() {
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.speedMultiplierSelect = document.getElementById('speed-multiplier');
        
        this.isPlaying = false;
        this.initEventListeners();
    }

    initEventListeners() {
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        this.speedMultiplierSelect.addEventListener('change', (e) => {
            const multiplier = parseInt(e.target.value);
            if (simulationEngine) {
                simulationEngine.setSpeedMultiplier(multiplier);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetSimulation();
            }
        });
    }

    togglePlayPause() {
        if (!simulationEngine) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.playPauseBtn.textContent = 'PAUSE';
        this.playPauseBtn.classList.add('paused');
        simulationEngine.start();
    }

    pause() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = 'PLAY';
        this.playPauseBtn.classList.remove('paused');
        simulationEngine.pause();
    }

    resetSimulation() {
        this.pause();
        if (simulationEngine) {
            simulationEngine.reset();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UIControls();
});
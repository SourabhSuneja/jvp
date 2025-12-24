        // Configuration for House Colors
        const houseConfig = {
            'Ruby': { 
                primary: '#ff4757', 
                colors: ['#ff4757', '#ff6b81', '#ffffff'] 
            },
            'Emerald': { 
                primary: '#2ed573', 
                colors: ['#2ed573', '#7bed9f', '#ffffff'] 
            },
            'Sapphire': { 
                primary: '#1e90ff', 
                colors: ['#1e90ff', '#70a1ff', '#ffffff'] 
            },
            'Topaz': { 
                primary: '#ffa502', 
                colors: ['#ffa502', '#eccc68', '#ffffff'] 
            }
        };

        const overlay = document.getElementById('winner-overlay');
        const card = document.getElementById('winner-card');
        const houseNameEl = document.getElementById('house-name');
        const scoreEl = document.getElementById('score-val');

        function triggerWin(houseName, score) {
            const config = houseConfig[houseName] || houseConfig['Topaz'];
            
            // 1. Set Content
            houseNameEl.innerText = houseName;
            scoreEl.innerText = score;
            
            // 2. Set Theme Colors via CSS Variables
            // We set the background glow to the house color, but dark/subtle
            document.documentElement.style.setProperty('--bg-color', shadeColor(config.primary, -60));
            
            // 3. Reset Classes
            card.className = 'winner-card';
            card.classList.add(`theme-${houseName.toLowerCase()}`);

            // 4. Show Overlay
            overlay.classList.add('active');

            // 5. Fire Confetti (Canvas Confetti Library)
            fireConfetti(config.colors);

            // 6. Set scrolling headline
            updateScrollingText(houseName + ' House Triumphs at JVP Sports Meet 2025–26, Secures Victory with ' + score + ' points.', 999999999);
        }

        function hideWinner() {
            overlay.classList.remove('active');
        }

        // --- Confetti Logic ---
        function fireConfetti(colors) {
            // Burst 1: Center
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: colors,
                zIndex: 10000
            });

            // Burst 2: Side Cannons (School Pride)
            var end = Date.now() + 99999999; // Run for a long time

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors,
                    zIndex: 10000
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors,
                    zIndex: 10000
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }

        // Helper to darken colors for background
        function shadeColor(color, percent) {
            var R = parseInt(color.substring(1,3),16);
            var G = parseInt(color.substring(3,5),16);
            var B = parseInt(color.substring(5,7),16);

            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);

            R = (R<255)?R:255;  
            G = (G<255)?G:255;  
            B = (B<255)?B:255;  

            var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
            var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
            var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

            return "#"+RR+GG+BB;
        }

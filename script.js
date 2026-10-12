/* ═══════════════════════════════════════════════════════════
   POUR TOI — interactions
   1. Pétales (canvas)      2. Gestion des scènes
   3. Maintenir pour ouvrir 4. Les trois cartes
   5. La fleur finale       6. Rejouer
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Signale que le JS est là : les masques ne cachent le texte que si on peut les ouvrir
    document.documentElement.classList.add('js');

    /* ───────────────────────────────────────────────────────
       À PERSONNALISER — c'est tout ce que tu as à toucher
       ─────────────────────────────────────────────────────── */
    const CONFIG = {
        NOM: 'Rouchidiyath',        // son prénom
        MONOGRAMME: 'R',            // la lettre gravée sur le sceau
        SIGNATURE: '',              // ← mets ton prénom ici, ex : 'Adam'
        DATE: 'Écrite un soir, en pensant à toi',
        HOLD_MS: 760,               // durée du maintien (sceau / fleur)
    };
    /* ─────────────────────────────────────────────────────── */

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MOBILE = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    const $ = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a, b) => a + Math.random() * (b - a);

    /* ═══════════════════════════════════════════════════════
       0 · PERSONNALISATION
       ═══════════════════════════════════════════════════════ */
    $$('[data-nom]').forEach(function (el) { el.textContent = CONFIG.NOM; });
    document.title = 'Pour toi, ' + CONFIG.NOM;
    $('.seal__mono').textContent = CONFIG.MONOGRAMME;
    if (CONFIG.SIGNATURE) $('[data-signature]').textContent = '— ' + CONFIG.SIGNATURE;
    if (CONFIG.DATE) $('[data-date]').textContent = CONFIG.DATE;

    /* ═══════════════════════════════════════════════════════
       1 · PÉTALES
       ═══════════════════════════════════════════════════════ */
    const canvas = $('#petals');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, DPR = 1;

    const PALETTE = [
        ['#FFE6E1', '#F3C4CC'],
        ['#FBE0E4', '#E7B3BF'],
        ['#FFF0EA', '#F5CFD2'],
        ['#F6D8DE', '#DFA3B4'],
        ['#FFF4F0', '#EFC6C9'],
    ];

    // Pétales pré-dessinés une seule fois (bien plus rapide qu'un tracé par frame)
    const SPRITES = PALETTE.map(function (pair) {
        const S = 80;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const x = c.getContext('2d');
        const g = x.createLinearGradient(S * 0.3, 0, S * 0.7, S);
        g.addColorStop(0, pair[0]);
        g.addColorStop(1, pair[1]);
        x.fillStyle = g;
        x.beginPath();
        x.moveTo(S / 2, 2);
        x.bezierCurveTo(S * 0.96, S * 0.3, S * 0.84, S * 0.8, S / 2, S - 2);
        x.bezierCurveTo(S * 0.16, S * 0.8, S * 0.04, S * 0.3, S / 2, 2);
        x.closePath();
        x.fill();
        x.strokeStyle = 'rgba(255,255,255,.5)';
        x.lineWidth = 1.3;
        x.beginPath();
        x.moveTo(S / 2, 8);
        x.quadraticCurveTo(S / 2 + 2, S / 2, S / 2, S - 10);
        x.stroke();
        return c;
    });

    function Petal(kind, ox, oy) {
        this.sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
        this.kind = kind;                        // 'drift' | 'burst'
        this.rot = rand(0, Math.PI * 2);
        this.spin = rand(-0.012, 0.012);
        this.tilt = rand(0, Math.PI * 2);
        this.tiltSpeed = rand(0.012, 0.034);
        this.life = 1;

        if (kind === 'burst') {
            this.x = ox; this.y = oy;
            const a = rand(0, Math.PI * 2);
            const f = rand(1.6, 7.5);
            this.vx = Math.cos(a) * f;
            this.vy = Math.sin(a) * f - rand(0.5, 2.6);
            this.size = rand(9, 19);
            this.decay = rand(0.006, 0.013);
            this.gravity = 0.055;
            this.alpha = rand(0.7, 1);
        } else {
            this.x = rand(-40, W + 40);
            this.y = rand(-H * 0.6, -10);
            this.vx = rand(-0.12, 0.12);
            this.vy = rand(0.16, 0.52);
            this.size = rand(7, 15);
            this.sway = rand(0.18, 0.55);
            this.swaySpeed = rand(0.006, 0.016);
            this.phase = rand(0, Math.PI * 2);
            this.alpha = rand(0.3, 0.62);
            this.decay = 0;
            this.gravity = 0;
        }
    }

    Petal.prototype.update = function (dt) {
        if (this.kind === 'burst') {
            this.vx *= 0.985;
            this.vy = this.vy * 0.985 + this.gravity;
            this.life -= this.decay * dt;
        } else {
            this.phase += this.swaySpeed * dt;
            this.vx = Math.sin(this.phase) * this.sway;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rot += this.spin * dt;
        this.tilt += this.tiltSpeed * dt;

        if (this.kind === 'drift' && this.y > H + 40) {
            this.x = rand(-40, W + 40);
            this.y = rand(-60, -10);
        }
    };

    Petal.prototype.draw = function () {
        const flutter = 0.32 + 0.68 * Math.abs(Math.cos(this.tilt));
        const w = this.size * flutter;
        const h = this.size * 1.42;
        const a = this.alpha * clamp(this.life, 0, 1);
        if (a <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = a;
        // les pétales proches (grands) dérivent davantage : effet de profondeur
        ctx.translate(this.x + PAR.x * this.size * 1.5, this.y + PAR.y * this.size * 0.95);
        ctx.rotate(this.rot);
        ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
        ctx.restore();
    };

    let petals = [];

    /* Profondeur : un parallaxe léger donne du volume à la scène */
    const PAR = { x: 0, y: 0, tx: 0, ty: 0 };
    const CAN_PAR = !REDUCED && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const parFar = $('.par--far');
    const parNear = $('.par--near');

    if (CAN_PAR) {
        window.addEventListener('pointermove', function (e) {
            PAR.tx = (e.clientX / Math.max(1, W) - 0.5) * 2;
            PAR.ty = (e.clientY / Math.max(1, H) - 0.5) * 2;
        }, { passive: true });
    }

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function seedPetals() {
        const n = REDUCED ? 10 : (MOBILE ? 14 : 24);
        petals = [];
        for (let i = 0; i < n; i++) {
            const p = new Petal('drift');
            p.y = rand(0, H);                    // réparties dès le départ
            petals.push(p);
        }
    }

    function burst(x, y, n) {
        if (REDUCED) return;
        for (let i = 0; i < n; i++) petals.push(new Petal('burst', x, y));
    }

    function centerOf(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    let last = performance.now();
    let running = true;

    function loop(now) {
        if (!running) return;
        const dt = clamp((now - last) / 16.667, 0.2, 3);
        last = now;

        // parallaxe lissée
        if (CAN_PAR) {
            PAR.x += (PAR.tx - PAR.x) * 0.045 * dt;
            PAR.y += (PAR.ty - PAR.y) * 0.045 * dt;
            parFar.style.transform = 'translate3d(' + (PAR.x * -10).toFixed(2) + 'px,' + (PAR.y * -7).toFixed(2) + 'px,0)';
            parNear.style.transform = 'translate3d(' + (PAR.x * -24).toFixed(2) + 'px,' + (PAR.y * -16).toFixed(2) + 'px,0)';
        }

        ctx.clearRect(0, 0, W, H);
        for (let i = petals.length - 1; i >= 0; i--) {
            const p = petals[i];
            p.update(dt);
            p.draw();
            if (p.kind === 'burst' && p.life <= 0) petals.splice(i, 1);
        }
        requestAnimationFrame(loop);
    }

    function repaintStatic() {
        ctx.clearRect(0, 0, W, H);
        petals.forEach(function (p) { p.draw(); });
    }

    resize();
    seedPetals();
    if (REDUCED) {
        repaintStatic();
    } else {
        requestAnimationFrame(function (t) { last = t; loop(t); });
    }

    window.addEventListener('resize', function () {
        resize();
        if (REDUCED) repaintStatic();
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            running = false;
        } else if (!REDUCED) {
            running = true;
            last = performance.now();
            requestAnimationFrame(loop);
        }
    });

    /* ═══════════════════════════════════════════════════════
       2 · SCÈNES
       ═══════════════════════════════════════════════════════ */
    const SCENES = ['scene-intro', 'scene-letter', 'scene-notes', 'scene-end'];
    const bar = $('#progressBar');
    let current = 0;
    let switching = false;

    function goTo(index) {
        index = clamp(index, 0, SCENES.length - 1);
        if (index === current || switching) return;
        switching = true;

        const out = document.getElementById(SCENES[current]);
        const inn = document.getElementById(SCENES[index]);

        out.classList.add('is-leaving');
        bar.style.width = ((index + 1) / SCENES.length * 100) + '%';

        setTimeout(function () {
            out.classList.remove('is-active', 'is-leaving', 'is-in');
            inn.classList.add('is-active');
            // re-découpe les lignes avec les polices réellement chargées,
            // juste avant la révélation : les coupures sont toujours justes
            if (inn.querySelector('.lm')) resplitLines();
            // une frame plus tard : on arme les masques pour que la révélation joue
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { inn.classList.add('is-in'); });
            });
            current = index;
            try { window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); }
            catch (_) { window.scrollTo(0, 0); }
            setTimeout(function () { switching = false; }, 480);
        }, REDUCED ? 60 : 520);
    }

    /* ═══════════════════════════════════════════════════════
       3 · MAINTENIR POUR ACTIVER
       ═══════════════════════════════════════════════════════ */
    function holdToActivate(el, ring, opts) {
        const DURATION = opts.duration || CONFIG.HOLD_MS;
        const LEN = parseFloat(ring.getAttribute('data-len')) || 0;
        let raf = null, start = 0, done = false, holding = false;
        let taps = 0, suppressClick = 0;

        function setRing(p) {
            if (LEN) ring.style.strokeDashoffset = String(LEN * (1 - p));
        }

        function finish() {
            if (done) return;
            done = true;
            holding = false;
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            setRing(1);
            el.classList.remove('is-holding');
            el.classList.add('is-done');
            if (opts.onComplete) opts.onComplete();
        }

        function tick() {
            const p = clamp((performance.now() - start) / DURATION, 0, 1);
            setRing(p);
            if (opts.onProgress) opts.onProgress(p);
            if (p >= 1) { finish(); return; }
            raf = requestAnimationFrame(tick);
        }

        function down(e) {
            if (done) return;
            if (e.cancelable) e.preventDefault();
            try { el.setPointerCapture(e.pointerId); } catch (_) { /* vieux navigateurs */ }
            holding = true;
            start = performance.now();
            el.classList.add('is-holding');
            tick();
        }

        function up() {
            if (!holding) return;
            holding = false;
            const p = clamp((performance.now() - start) / DURATION, 0, 1);
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            el.classList.remove('is-holding');
            if (!done) {
                setRing(0);
                if (opts.onProgress) opts.onProgress(0);
                if (p > 0.18) {                    // vrai maintien interrompu
                    suppressClick = Date.now();
                    if (opts.onAbort) opts.onAbort(p);
                }
            }
        }

        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('lostpointercapture', up);

        // Clic / clavier : filet de sécurité pour ne jamais rester bloqué
        el.addEventListener('click', function (e) {
            e.preventDefault();
            if (done) return;
            if (Date.now() - suppressClick < 450) return;
            taps++;
            if (taps >= 2) { finish(); return; }
            setRing(0.4);
            setTimeout(function () { if (!done && !holding) setRing(0); }, 460);
            if (opts.onTap) opts.onTap();
        });

        return {
            reset: function () {
                done = false; holding = false; taps = 0; suppressClick = 0;
                if (raf) cancelAnimationFrame(raf);
                raf = null;
                el.classList.remove('is-holding', 'is-done');
                setRing(0);
            }
        };
    }

    function nudge(el, msg) {
        if (!el) return;
        const original = el.dataset.text || '';
        el.classList.remove('is-nudge');
        void el.offsetWidth;                       // relance l'animation
        el.innerHTML = '<span class="hint__dot"></span> ' + msg;
        el.classList.add('is-nudge');
        clearTimeout(el._t);
        el._t = setTimeout(function () {
            el.innerHTML = '<span class="hint__dot"></span> ' + original;
            el.classList.remove('is-nudge');
        }, 1900);
    }

    /* ═══════════════════════════════════════════════════════
       4 · LE SCEAU / L'ENVELOPPE
       ═══════════════════════════════════════════════════════ */
    const envelope = $('#envelope');
    const seal = $('#seal');
    const sealRing = $('#sealRing');
    const sealHint = $('#sealHint');
    const SEAL_LEN = 2 * Math.PI * 36;

    sealRing.setAttribute('data-len', String(SEAL_LEN));
    sealRing.style.strokeDashoffset = String(SEAL_LEN);
    sealHint.dataset.text = 'Maintiens le sceau pour l’ouvrir';

    let envelopeOpened = false;

    const sealHold = holdToActivate(seal, sealRing, {
        onAbort: function () { nudge(sealHint, 'Encore un peu… ne lâche pas'); },
        onTap: function () { nudge(sealHint, 'Maintiens-le, ne tape pas'); },
        onComplete: openEnvelope
    });

    function openEnvelope() {
        if (envelopeOpened) return;
        envelopeOpened = true;
        seal.classList.add('is-broken');
        $('#scene-intro').classList.add('is-opening');
        sealHint.classList.add('is-gone');

        burstAt(seal, MOBILE ? 22 : 34);

        setTimeout(function () { envelope.classList.add('is-open'); }, 260);
        setTimeout(function () { envelope.classList.add('is-unsealed'); }, 1060);
        setTimeout(function () {
            envelope.classList.add('is-gone');
            sealHint.classList.add('is-gone');
        }, 2080);
        setTimeout(function () { goTo(1); }, 2420);
    }

    function burstAt(el, n, dy) {
        const c = centerOf(el);
        burst(c.x, c.y + (dy || 0), n);
    }

    /* ═══════════════════════════════════════════════════════
       5 · LETTRE → CARTES
       ═══════════════════════════════════════════════════════ */
    $('#toNotes').addEventListener('click', function () { goTo(2); });

    /* ═══════════════════════════════════════════════════════
       6 · LES TROIS CARTES
       ═══════════════════════════════════════════════════════ */
    const cards = $$('[data-card]');
    const countEl = $('#cardCount');
    const toEnd = $('#toEnd');

    function refreshCards() {
        const flipped = cards.filter(function (c) { return c.classList.contains('is-flipped'); });
        countEl.textContent = String(flipped.length);
        if (flipped.length === cards.length) {
            toEnd.classList.add('is-unlocked');
            toEnd.disabled = false;
        } else {
            toEnd.classList.remove('is-unlocked');
            toEnd.disabled = true;
        }
    }

    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            const wasFlipped = card.classList.contains('is-flipped');
            card.classList.toggle('is-flipped');
            card.setAttribute('aria-pressed', String(!wasFlipped));
            if (!wasFlipped) burstAt(card, MOBILE ? 7 : 11, -10);
            refreshCards();
        });
    });

    toEnd.addEventListener('click', function () { if (!toEnd.disabled) goTo(3); });

    /* ═══════════════════════════════════════════════════════
       7 · LA FLEUR FINALE
       ═══════════════════════════════════════════════════════ */
    const rose = $('#rose');
    const roseRing = $('#roseRing');
    const roseHint = $('#roseHint');
    const ps = $('#ps');
    const ROSE_LEN = 2 * Math.PI * 44;

    roseRing.setAttribute('data-len', String(ROSE_LEN));
    roseRing.style.strokeDashoffset = String(ROSE_LEN);
    roseHint.dataset.text = 'Maintiens la fleur';

    let roseDone = false;

    const roseHold = holdToActivate(rose, roseRing, {
        duration: CONFIG.HOLD_MS * 1.25,
        onAbort: function () { nudge(roseHint, 'Encore un peu…'); },
        onTap: function () { nudge(roseHint, 'Maintiens-la quelques secondes'); },
        onComplete: function () {
            if (roseDone) return;
            roseDone = true;
            roseHint.classList.add('is-gone');
            burstAt(rose, MOBILE ? 34 : 52);
            setTimeout(function () { ps.classList.add('is-shown'); }, 420);
            setTimeout(function () { burstAt(rose, MOBILE ? 14 : 22, -30); }, 950);
        }
    });

    /* ═══════════════════════════════════════════════════════
       8 · REJOUER
       ═══════════════════════════════════════════════════════ */
    $('#replay').addEventListener('click', function () {
        document.documentElement.classList.add('no-anim');

        envelope.classList.remove('is-open', 'is-unsealed', 'is-gone');
        $('#scene-intro').classList.remove('is-opening');
        seal.classList.remove('is-broken');
        sealHold.reset();
        sealRing.style.strokeDashoffset = String(SEAL_LEN);
        sealHint.classList.remove('is-gone');
        sealHint.style.opacity = '';
        envelopeOpened = false;

        cards.forEach(function (c) {
            c.classList.remove('is-flipped');
            c.removeAttribute('aria-pressed');
        });
        refreshCards();

        rose.classList.remove('is-done');
        roseHold.reset();
        roseRing.style.strokeDashoffset = String(ROSE_LEN);
        roseHint.classList.remove('is-gone');
        roseHint.style.opacity = '';
        ps.classList.remove('is-shown');
        roseDone = false;

        seedPetals();
        if (REDUCED) repaintStatic();

        void envelope.offsetWidth;                 // force le reflow
        document.documentElement.classList.remove('no-anim');

        goTo(0);
    });

    /* Le maintien ne doit pas faire défiler la page (iOS) */
    document.addEventListener('touchmove', function (e) {
        if (e.target && e.target.closest && e.target.closest('.seal, .rosebtn')) e.preventDefault();
    }, { passive: false });

    /* Clavier : Entrée déclenche l'élément de la scène en cours */
    window.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (current === 0 && !envelopeOpened) { e.preventDefault(); openEnvelope(); }
        else if (current === 3 && !roseDone) { e.preventDefault(); roseHold.reset(); rose.click(); rose.click(); }
    });

    /* ═══════════════════════════════════════════════════════
       9 · MOTION — masques de ligne & de caractère
       ═══════════════════════════════════════════════════════ */
    function splitChars(el) {
        const raw = el.dataset.raw || el.textContent;
        el.dataset.raw = raw;
        el.textContent = '';
        Array.from(raw).forEach(function (ch, i) {
            const mask = document.createElement('span');
            mask.className = 'ch';
            const inner = document.createElement('span');
            inner.className = 'ch__in';
            inner.style.setProperty('--c', i);
            inner.textContent = ch === ' ' ? '\u00A0' : ch;
            mask.appendChild(inner);
            el.appendChild(mask);
        });
        el.classList.add('is-split');
    }

    let lineCursor = 0;

    function splitLines(el) {
        const raw = el.dataset.raw || el.textContent;
        el.dataset.raw = raw;
        el.textContent = '';

        // 1 · mots mesurables
        const spans = raw.trim().split(/\s+/).map(function (w) {
            const s = document.createElement('span');
            s.className = 'w';
            s.style.display = 'inline-block';
            s.textContent = w;
            el.appendChild(s);
            el.appendChild(document.createTextNode(' '));
            return s;
        });

        // 2 · regroupement par ligne visuelle
        const groups = [];
        let lastTop = null;
        spans.forEach(function (s) {
            const top = s.offsetTop;
            if (lastTop === null || Math.abs(top - lastTop) > 2) { groups.push([]); lastTop = top; }
            groups[groups.length - 1].push(s);
        });

        // 3 · reconstruction derrière les masques, en cascade
        el.textContent = '';
        groups.forEach(function (group) {
            const line = document.createElement('span');
            line.className = 'line';
            const inner = document.createElement('span');
            inner.className = 'line__in';
            inner.style.setProperty('--d', Math.min(lineCursor * 62, 1500) + 'ms');
            lineCursor++;
            group.forEach(function (s, j) {
                inner.appendChild(s);
                if (j < group.length - 1) inner.appendChild(document.createTextNode(' '));
            });
            line.appendChild(inner);
            el.appendChild(line);
        });
        el.classList.add('is-split');
    }

    function splitAll() {
        lineCursor = 0;
        $$('.display').forEach(splitChars);
        $$('.lm').forEach(splitLines);
    }

    function resplitLines() {
        document.documentElement.classList.add('no-anim');
        lineCursor = 0;
        $$('.lm').forEach(splitLines);
        void document.body.offsetWidth;
        document.documentElement.classList.remove('no-anim');
    }

    // Le découpage doit se faire avec la vraie police, sinon les coupures sont fausses
    let resplitTimer = null;
    function queueResplit() {
        clearTimeout(resplitTimer);
        resplitTimer = setTimeout(resplitLines, 90);
    }

    if (REDUCED) {
        $$('.lm, .display').forEach(function (el) { el.classList.add('is-split'); });
    } else {
        splitAll();

        if (document.fonts && document.fonts.load) {
            Promise.all([
                document.fonts.load('300 20px "Cormorant Garamond"', 'Lettre pour toi'),
                document.fonts.load('italic 300 20px "Cormorant Garamond"', 'Lettre pour toi'),
                document.fonts.load('400 12px "Jost"', 'Lettre pour toi'),
            ]).then(queueResplit, queueResplit);
            if (document.fonts.addEventListener) {
                document.fonts.addEventListener('loadingdone', queueResplit);
            }
        }
        window.addEventListener('load', queueResplit);

        let rt = null;
        window.addEventListener('resize', function () {
            clearTimeout(rt);
            rt = setTimeout(resplitLines, 220);
        });
        // scène d'ouverture : on arme les masques une fois le découpage prêt
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.getElementById('scene-intro').classList.add('is-in');
            });
        });
    }

    refreshCards();
})();

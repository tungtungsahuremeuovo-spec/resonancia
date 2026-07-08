// ====================================================================
// SITE CORPORATIVO
// ====================================================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('mainNav').addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link || !link.dataset.page) return;
        e.preventDefault();
        const page = link.dataset.page;
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav a').forEach(el => el.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        link.classList.add('active');
    });
    loadWorld();
    
    // Inicializa o contador de visitas
    let counter = localStorage.getItem('visitor_count') || 0;
    counter = parseInt(counter) + 1;
    localStorage.setItem('visitor_count', counter);
    document.getElementById('visitorCounter').innerText = String(counter).padStart(7, '0');
});

function toggleLogin() {
    const form = document.getElementById('loginForm');
    form.classList.toggle('visible');
    if (form.classList.contains('visible')) document.getElementById('username').focus();
    else document.getElementById('loginMsg').innerText = '';
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('loginMsg');
    const btn = document.getElementById('loginBtn');

    if (user === 'admin' && pass === '2000') {
        btn.disabled = true;
        msg.style.color = '#008000';
        msg.innerText = 'Acesso autorizado. Redirecionando...';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        setTimeout(() => {
            document.getElementById('corporateSite').classList.add('hidden');
            document.getElementById('biosContainer').classList.add('active');
            startARG();
            btn.disabled = false;
        }, 800);
    } else {
        msg.style.color = '#ff0000';
        msg.innerText = 'Credenciais inválidas.';
    }
    return false;
}

function handleContact(e) {
    e.preventDefault();
    const msg = document.getElementById('contactMsg');
    msg.style.color = '#008000';
    msg.innerText = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
    document.getElementById('contactForm').reset();
    console.log('[CONTATO] Mensagem enviada pelo site corporativo.');
    setTimeout(() => {
        msg.innerText = '';
    }, 5000);
    return false;
}

// ====================================================================
// ARG - ESTADO E INICIALIZAÇÃO
// ====================================================================
let _argStarted = false;
let _booted = false;

function bootKeyHandler(e) {
    if (e.key === 'Enter' && !_booted) { _booted = true; doBoot(); }
}
function bootClickHandler(e) {
    if (!_booted) { _booted = true; doBoot(); }
}

const world = {
    radioSynced: false,
    calendarMarked: false,
    calendarMarked24: false,
    calendarMarked12: false,
    calendarMarked25: false,
    calendarMarked1: false,
    calendarMarked6: false,
    terminalOpened: 0,
    ieReopened: false,
    logReadAfterMark: false,
    noteLinesAdded: [],
    sessionTime: 0,
    radioPlaying: false,
    radioCtx: null,
    radioOsc: null,
    radioGain: null,
    promptChanged: false,
    isFrozen: false,
    burnIn: false,
    glitchActive: false,
    finalTriggered: false,
    startTime: Date.now(),
    invalidCommands: 0
};
let history = [];

function loadWorld() {
    try {
        const saved = JSON.parse(localStorage.getItem('lugar_final_state'));
        if (saved) {
            Object.assign(world, saved);
            history = saved.history || [];
        }
    } catch(e) {}
}
function saveWorld() {
    const toSave = { ...world, history };
    localStorage.setItem('lugar_final_state', JSON.stringify(toSave));
}

function startARG() {
    if (_argStarted) return;
    _argStarted = true;
    _booted = false;
    document.removeEventListener('keydown', bootKeyHandler);
    document.removeEventListener('click', bootClickHandler);
    document.addEventListener('keydown', bootKeyHandler);
    document.addEventListener('click', bootClickHandler);
    setTimeout(() => {
        if (!_booted) { _booted = true; doBoot(); }
    }, 300);
}

function doBoot() {
    document.getElementById('bootScreen').classList.add('hidden');
    document.getElementById('desktop').classList.add('active');
    document.getElementById('taskbar').classList.add('active');
    setTimeout(() => {
        document.getElementById('burnIn').classList.add('active');
        world.burnIn = true;
    }, 60000);
    setInterval(() => {
        if (!world.isFrozen && Math.random() > 0.98) {
            const overlay = document.createElement('div');
            overlay.className = 'glitch-overlay active';
            overlay.id = 'glitchOverlay';
            document.querySelector('.bios-container').appendChild(overlay);
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 100);
            }, 200);
        }
    }, 3000);
    initClock();
    setTimeout(() => openWindow('terminal'), 300);
    playAmbient();
}

// ==========================================================================
// SOM AMBIENTE E EFEITOS SONOROS
// ==========================================================================
let ambientAudioCtx = null;
let ambientOsc = null;
let ambientGain = null;
let ambientInterval = null;

function playAmbient() {
    if (ambientAudioCtx) return;
    try {
        ambientAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        ambientOsc = ambientAudioCtx.createOscillator();
        ambientGain = ambientAudioCtx.createGain();
        ambientOsc.type = 'sawtooth';
        ambientOsc.frequency.value = 55;
        ambientGain.gain.value = 0.015;
        ambientOsc.connect(ambientGain);
        ambientGain.connect(ambientAudioCtx.destination);
        ambientOsc.start();
        ambientInterval = setInterval(() => {
            if (ambientOsc) {
                ambientOsc.frequency.value = 50 + Math.random() * 20;
            }
        }, 5000);
    } catch(e) {}
}

function playKeyClick() {
    if (!ambientAudioCtx) return;
    try {
        const osc = ambientAudioCtx.createOscillator();
        const gain = ambientAudioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 800;
        gain.gain.value = 0.03;
        gain.gain.exponentialRampToValueAtTime(0.001, ambientAudioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ambientAudioCtx.destination);
        osc.start();
        osc.stop(ambientAudioCtx.currentTime + 0.05);
    } catch(e) {}
}

function playTune() {
    if (!ambientAudioCtx) return;
    try {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = ambientAudioCtx.createOscillator();
                const gain = ambientAudioCtx.createGain();
                osc.frequency.value = freq;
                gain.gain.value = 0.1;
                gain.gain.exponentialRampToValueAtTime(0.001, ambientAudioCtx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(ambientAudioCtx.destination);
                osc.start();
                osc.stop(ambientAudioCtx.currentTime + 0.3);
            }, i * 150);
        });
    } catch(e) {}
}

function playSuccess() {
    if (!ambientAudioCtx) return;
    try {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = ambientAudioCtx.createOscillator();
                const gain = ambientAudioCtx.createGain();
                osc.frequency.value = freq;
                gain.gain.value = 0.2;
                gain.gain.exponentialRampToValueAtTime(0.001, ambientAudioCtx.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(ambientAudioCtx.destination);
                osc.start();
                osc.stop(ambientAudioCtx.currentTime + 0.4);
            }, i * 200);
        });
    } catch(e) {}
}

// ==========================================================================
// GERENCIADOR DE JANELAS
// ==========================================================================
let zIndex = 100;

function createWindow(id, title, width, height, html) {
    if (document.getElementById(id)) {
        const win = document.getElementById(id);
        win.classList.add('active');
        win.style.display = '';
        win.style.zIndex = ++zIndex;
        updateTaskbarActive(id);
        return;
    }

    const win = document.createElement('div');
    win.className = 'window active';
    win.id = id;
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.left = (30 + Math.random() * 150) + 'px';
    win.style.top = (30 + Math.random() * 100) + 'px';
    win.style.zIndex = ++zIndex;

    const sysIcon = world.radioSynced ? 'π' : '●';
    const syncClass = world.radioSynced ? 'sysicon synced' : 'sysicon';

    win.innerHTML = `
        <div class="titlebar">
            <span><span class="${syncClass}">${sysIcon}</span> ${title}</span>
            <div class="controls">
                <span onclick="minimizeWindow('${id}')">—</span>
                <span onclick="closeWindow('${id}')">✖</span>
            </div>
        </div>
        <div class="body">${html}</div>
    `;

    document.getElementById('biosContainer').appendChild(win);

    const tbItem = document.createElement('div');
    tbItem.className = 'item';
    tbItem.id = 'tb-' + id;
    tbItem.innerText = title;
    tbItem.onclick = () => {
        const w = document.getElementById(id);
        if (w) {
            if (!w.classList.contains('active')) {
                w.classList.add('active');
                w.style.display = '';
                w.style.zIndex = ++zIndex;
            } else {
                w.classList.remove('active');
                w.style.display = 'none';
            }
            updateTaskbarActive(id);
        }
    };
    document.getElementById('tbItems').appendChild(tbItem);
    updateTaskbarActive(id);

    const bar = win.querySelector('.titlebar');
    let dx, dy, dragging = false;
    bar.addEventListener('mousedown', (e) => {
        dragging = true;
        dx = e.clientX - win.offsetLeft;
        dy = e.clientY - win.offsetTop;
        win.style.zIndex = ++zIndex;
    });
    document.addEventListener('mousemove', (e) => {
        if (dragging) {
            win.style.left = (e.clientX - dx) + 'px';
            win.style.top = (e.clientY - dy) + 'px';
        }
    });
    document.addEventListener('mouseup', () => { dragging = false; });
}

function openWindow(id) {
    const existingWin = document.getElementById(id);
    if (existingWin) {
        existingWin.classList.add('active');
        existingWin.style.display = '';
        existingWin.style.zIndex = ++zIndex;
        updateTaskbarActive(id);
        if (id === 'terminal') {
            const input = document.getElementById('termIn');
            if (input) setTimeout(() => input.focus(), 50);
        }
        return;
    }

    let title = '', width = 450, height = 300, html = '';

    switch(id) {
        case 'terminal':
            title = 'TERMINAL';
            width = 620; height = 480;
            world.terminalOpened++;
            let promptText = '/>';
            if (world.radioSynced && world.terminalOpened >= 2 && !world.promptChanged) {
                promptText = '/π>';
                world.promptChanged = true;
                saveWorld();
            }
            html = `<div class="terminal"><div class="term-out" id="termOut"></div><div class="term-line"><span class="term-prompt" id="termPrompt">${promptText}</span><input class="term-input" id="termIn" type="text" autofocus></div></div>`;
            break;
        case 'ie':
            title = 'INTERNET EXPLORER';
            width = 480; height = 300;
            let ieDate = '31/12/1999';
            if (world.radioSynced && !world.ieReopened) {
                ieDate = '01/01/2000';
                world.ieReopened = true;
                saveWorld();
            } else if (world.radioSynced) {
                ieDate = '01/01/2000';
            } else {
                ieDate = '31/12/1999';
            }
            let ieContent = `<div style="background:#000; color:#00ff41; padding:10px; height:200px; border:1px solid #00ff41; overflow:auto;">
                        <h3>Projeto Ressonância</h3>
                        <p>Servidor offline.</p>
                        <p style="font-size:0.7em; color:#555; margin-top:10px;">Última atualização: ${ieDate}</p>
                        <p style="font-size:0.7em; color:#555; margin-top:5px;">Sistema operacional: Windows 2000</p>`;
            if (world.radioSynced && world.calendarMarked) {
                ieContent += `<hr><p style="color:#ff00ff;">Você encontrou a página oculta.</p>
                        <p>O portal está em 1999. A chave é REVERSE.</p>
                        <p>Download: <a href="#" onclick="alert('Arquivo baixado: portal.zip (simulado)')">portal.zip</a></p>`;
            }
            ieContent += `</div>`;
            html = ieContent;
            break;
        case 'notepad':
            title = 'BLOCO DE NOTAS';
            width = 420; height = 300;
            let notes = 'Anotações esparsas:\n- O som está em algum lugar.\n- O calendário não parece confiável.';
            html = `<textarea id="notepadContent" style="width:100%; height:100%; background:#000; color:#00ff41; border:none; font-family:'VT323'; font-size:1.1em; resize:none; padding:5px;">${notes}</textarea>`;
            break;
        case 'radio':
            title = 'RÁDIO AM';
            width = 460; height = 310;
            html = `<div class="radio-container">
                        <canvas id="radioCanvas" width="420" height="100" style="width:100%; height:100px; border:1px solid #00ffff; background:#000;"></canvas>
                        <input type="range" id="freqSlider" min="100" max="2500" value="800" style="width:100%; margin-top:10px; accent-color:#00ff41;">
                        <span id="freqDisplay" style="color:#00ffff;">800 Hz</span>
                        <div style="margin-top:10px;">
                            <button onclick="toggleRadio()" style="background:#000; border:1px solid #00ff41; color:#00ff41; font-family:'VT323'; cursor:pointer; padding:5px 15px; transition:0.2s; border-radius:2px;">LIGAR</button>
                        </div>
                        <div id="radioStatus" style="margin-top:5px; color:#555; font-size:0.8em;">Estático</div>
                    </div>`;
            break;
        case 'calendar':
            title = 'CALENDÁRIO';
            width = 400; height = 380;
            html = `<div id="calContainer"><h3 style="text-align:center; color:#ffff00; margin-bottom:10px;">DEZEMBRO 1999</h3>${buildCalendarHTML()}</div>`;
            break;
        case 'about':
            title = 'SOBRE';
            width = 320; height = 220;
            html = `<h3 style="color:#ff00ff;">LUGAR :: 2000</h3><p>Compilação: 31/12/1999</p><p style="color:#555; font-size:0.8em;">Não há informações úteis aqui.</p><p style="color:#333; font-size:0.6em;">Se você está lendo isso, já está dentro.</p>`;
            break;
        case 'sysinfo':
            openSysInfo();
            return;
        case 'archive':
            openArchive();
            return;
        case 'email':
            openEmail();
            return;
        default: return;
    }

    const win = document.createElement('div');
    win.className = 'window active';
    win.id = id;
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.left = (30 + Math.random() * 150) + 'px';
    win.style.top = (30 + Math.random() * 100) + 'px';
    win.style.zIndex = ++zIndex;

    const sysIcon = world.radioSynced ? 'π' : '●';
    const syncClass = world.radioSynced ? 'sysicon synced' : 'sysicon';

    win.innerHTML = `
                <div class="titlebar">
                    <span><span class="${syncClass}">${sysIcon}</span> ${title}</span>
                    <div class="controls">
                        <span onclick="minimizeWindow('${id}')">—</span>
                        <span onclick="closeWindow('${id}')">✖</span>
                    </div>
                </div>
                <div class="body">${html}</div>
            `;

    document.getElementById('biosContainer').appendChild(win);

    const tbItem = document.createElement('div');
    tbItem.className = 'item';
    tbItem.id = 'tb-' + id;
    tbItem.innerText = title;
    tbItem.onclick = () => {
        const w = document.getElementById(id);
        if (w) {
            if (!w.classList.contains('active')) {
                w.classList.add('active');
                w.style.display = '';
                w.style.zIndex = ++zIndex;
            } else {
                w.classList.remove('active');
                w.style.display = 'none';
            }
            updateTaskbarActive(id);
        }
    };
    document.getElementById('tbItems').appendChild(tbItem);
    updateTaskbarActive(id);

    if (id === 'terminal') {
        initTerminal();
        const input = document.getElementById('termIn');
        if (input) setTimeout(() => input.focus(), 50);
        win.addEventListener('click', (e) => {
            if (e.target.closest('.titlebar')) return;
            const input2 = document.getElementById('termIn');
            if (input2) input2.focus();
        });
    }
    if (id === 'radio') initRadio();

    const bar = win.querySelector('.titlebar');
    let dx, dy, dragging = false;
    bar.addEventListener('mousedown', (e) => {
        dragging = true;
        dx = e.clientX - win.offsetLeft;
        dy = e.clientY - win.offsetTop;
        win.style.zIndex = ++zIndex;
    });
    document.addEventListener('mousemove', (e) => {
        if (dragging) {
            win.style.left = (e.clientX - dx) + 'px';
            win.style.top = (e.clientY - dy) + 'px';
        }
    });
    document.addEventListener('mouseup', () => { dragging = false; });
}

function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.remove('active');
        win.style.display = 'none';
        updateTaskbarActive(id);
    }
}

function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        if (id === 'radio') {
            stopRadio();
            if (window._radioResizeObserver) {
                window._radioResizeObserver.disconnect();
                window._radioResizeObserver = null;
            }
        }
        win.remove();
        const tbItem = document.getElementById('tb-' + id);
        if (tbItem) tbItem.remove();
    }
}

function updateTaskbarActive(id) {
    document.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
    const tbItem = document.getElementById('tb-' + id);
    const win = document.getElementById(id);
    if (tbItem && win && win.classList.contains('active')) {
        tbItem.classList.add('active');
    }
}

// ==========================================================================
// APLICATIVOS ADICIONAIS
// ==========================================================================
function openSysInfo() {
    const uptime = Math.floor((Date.now() - world.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    const cpuUsage = (Math.random() * 20 + 80).toFixed(1);
    const memTotal = 1024;
    const memUsed = Math.floor(Math.random() * 200 + 400);
    const memFree = memTotal - memUsed;
    const portalPid = Math.floor(Math.random() * 1000 + 1000);

    const html = `
                <div style="font-family:'VT323'; font-size:1.1em; color:#00ff41;">
                    <p><strong>Sistema:</strong> LUGAR OS 2000</p>
                    <p><strong>Uptime:</strong> ${hours}h ${minutes}m ${seconds}s</p>
                    <p><strong>CPU:</strong> ${cpuUsage}% (processo portal: ${portalPid})</p>
                    <p><strong>Memória:</strong> ${memUsed}MB / ${memTotal}MB (${memFree}MB livres)</p>
                    <p><strong>Disco:</strong> /dev/sda1 2.0G 1.2G 800M 60% /</p>
                    <p><strong>Processos:</strong> 42, 1 zombie</p>
                    <hr style="border-color:#00ff41;">
                    <p style="color:#555; font-size:0.8em;">Última atualização: 31/12/1999 23:59:59</p>
                </div>
            `;
    createWindow('sysinfo', 'SISTEMA', 400, 320, html);
}

function openArchive() {
    const files = ['segredo.crypt', 'mapa.crypt', 'diario.crypt'];
    let html = `<div style="color:#00ff41; font-family:'VT323'; font-size:1.2em;">`;
    files.forEach(f => {
        html += `<p>${f} <button onclick="alert('Use decode --crypt ${f} <chave>')">Decifrar</button></p>`;
    });
    html += `</div>`;
    createWindow('archive', 'ARQUIVO', 400, 300, html);
}

function openEmail() {
    const messages = [
        { from: 'admin@ressonancia.com.br', subject: 'Bem-vindo', body: 'Você tem acesso ao sistema. Explore com cuidado.' },
        { from: 'portal@2000.projeto', subject: 'Sinal detectado', body: 'A porta está na frequência 1999. Use o rádio.' },
        { from: 'suporte@ressonancia.com.br', subject: 'Manutenção', body: 'O sistema será reiniciado em 31/12/1999.' },
    ];
    let html = `<div style="color:#00ff41; font-family:'VT323'; font-size:1em;">`;
    messages.forEach((msg, i) => {
        html += `<div style="border:1px solid #00ff41; padding:5px; margin:5px 0;">
                    <strong>De:</strong> ${msg.from}<br>
                    <strong>Assunto:</strong> ${msg.subject}<br>
                    <p>${msg.body}</p>
                </div>`;
    });
    html += `</div>`;
    createWindow('email', 'EMAIL', 450, 350, html);
}

// ==========================================================================
// TERMINAL - COMANDOS EXPANDIDOS
// ==========================================================================
function initTerminal() {
    const input = document.getElementById('termIn');
    const out = document.getElementById('termOut');
    if (!input || !out) return;

    out.innerHTML = `> Sistema de arquivos montado.<br><span style="color:#555;font-size:0.8em;">Dica: comandos comuns funcionam aqui.</span>`;

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim();
            input.value = '';
            history.push(cmd);
            saveWorld();
            out.innerHTML += `<br><span style="color:#ffff00;">> ${cmd}</span><br>`;
            let response = processCommand(cmd);
            if (response !== null) {
                out.innerHTML += `<br>${response}`;
            }
            out.scrollTop = out.scrollHeight;
            playKeyClick();
        }
    });
}

function processCommand(cmd) {
    const parts = cmd.trim().split(/\s+/);
    if (parts.length === 0) return null;
    const c = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (world.isFrozen) {
        if (c === 'date') return '00:00:00';
        if (c === 'whoami') return 'desconhecido';
        if (c === 'ping') return 'destino inalcançável';
    }

    // Efeito de interferência quando o rádio está ligado
    if (world.radioPlaying && Math.random() > 0.7) {
        // Mensagens corrompidas
        const corruptedReplies = [
            `[estática] ${c} não reconhecido.`,
            `[erro] comando ${c} corrompido.`,
            `[sinal] ${c}???`,
            `[interferência] tente novamente.`
        ];
        return corruptedReplies[Math.floor(Math.random() * corruptedReplies.length)];
    }

    switch(c) {
        case 'help':
            let help = 'Comandos: ls, cat, date, clear, history, whoami, find, ping, grep, tail, diff, chmod, man, uptime, df, free, uname, who, env, echo, complete, diario, jogo, crash, shutdown, portal, 1999, sintonizar, loop, meta, reboot';
            if (world.radioSynced) help += ' (Sistema em modo π)';
            return help;
        case 'ls':
            if (args.includes('-la')) {
                let files = 'bin   etc   var   mnt   tmp   .secret   proc   dev';
                if (world.radioSynced) files += '   radio.log';
                if (world.calendarMarked || world.calendarMarked24) files += '   portal.key';
                if (world.calendarMarked12) files += '   note12.txt';
                if (world.calendarMarked1) files += '   note1.txt';
                if (world.calendarMarked6) files += '   note6.txt';
                return files;
            }
            return 'bin   etc   var   mnt   tmp   proc   dev';
        case 'cat':
            if (args.length < 2) return 'cat: arquivo não especificado.';
            const file = args[1];
            if (file === 'hosts') {
                return world.radioSynced ? '127.0.0.1 localhost\n200.0.0.1 gateway.portal\n# SINAL DETECTADO EM 1999. A PORTA ESTÁ PERTO.' : '127.0.0.1 localhost\n200.0.0.1 gateway.portal';
            } else if (file === 'syslog') {
                let log = '1999-12-24 23:59:59 [ERROR] gateway.portal inacessível.\n1999-12-31 00:00:00 [CRITICAL] Anomalia detectada.';
                if (world.calendarMarked24) log += '\n1999-12-24 23:59:59 [INFO] Conexão tentada.';
                if (world.calendarMarked && !world.logReadAfterMark) {
                    world.logReadAfterMark = true;
                    saveWorld();
                    log += '\n1999-12-31 23:59:59 [INFO] A linha do tempo foi alterada.';
                }
                if (world.calendarMarked1) log += '\n1999-12-01 00:00:00 [INFO] Início do último mês de 1999.';
                return log;
            } else if (file === 'radio.log') {
                return world.radioSynced ? 'Frequência 1999 Hz capturada.\nSinal: π.' : 'Arquivo não encontrado.';
            } else if (file === 'portal.key') {
                return (world.calendarMarked || world.calendarMarked24) ? 'CHAVE: 2000_REVERSE' : 'Arquivo não encontrado.';
            } else if (file === '.secret') {
                return (world.radioSynced && world.calendarMarked) ? 'Você encontrou o segredo.\nO portal não é uma porta. É um reflexo.' : 'Arquivo não encontrado.';
            } else if (file === 'note12.txt') {
                return world.calendarMarked12 ? '12/12/1999 - O número do portal é 2000.' : 'Arquivo não encontrado.';
            } else if (file === 'note1.txt') {
                return world.calendarMarked1 ? '01/12/1999 - O último mês começa. A contagem regressiva começa.' : 'Arquivo não encontrado.';
            } else if (file === 'note6.txt') {
                return world.calendarMarked6 ? '06/12/1999 - A frequência correta é 1999.' : 'Arquivo não encontrado.';
            } else if (file === 'config.ini') {
                return 'PORTAL_PORT=1999\nFREQUENCY=???\nSESSION_KEY=???';
            } else if (file === 'version') {
                return 'Linux version 2.6.10-2000 (root@portal) (gcc version 3.2.3) #1 SMP Tue Dec 31 23:59:59 GMT 1999';
            } else if (file === 'cpuinfo') {
                return 'processor: 0\nvendor_id: GenuineIntel\ncpu family: 6\nmodel: 8\nmodel name: Pentium III\nstepping: 3\ncpu MHz: 600.000\ncache size: 256 KB';
            } else if (file === 'random') {
                return 'Conteúdo aleatório: ' + Math.random().toString(36).substring(2, 10) + '...';
            } else {
                return `cat: ${file}: arquivo não encontrado.`;
            }
        case 'date':
            return world.isFrozen ? '00:00:00' : '31/12/1999 23:59:59';
        case 'clear':
            const out = document.getElementById('termOut');
            if (out) out.innerHTML = '';
            return null;
        case 'history':
            if (args.includes('-c')) {
                history = [];
                return 'Histórico limpo.';
            }
            return history.map((h, i) => ` ${i+1}  ${h}`).join('\n') || 'Nenhum comando registrado.';
        case 'whoami':
            return world.radioSynced ? 'π' : 'root';
        case 'find':
            if (args.length < 2 || args[0] !== '/' || args[1] !== '-name') return 'find: uso: find / -name "padrão"';
            const pattern = args.slice(2).join(' ').replace(/^"|"$/g, '');
            let results = [];
            const patternRegex = pattern.replace(/\*/g, '.*');
            const regex = new RegExp('^' + patternRegex + '$');
            const allFiles = ['/var/log/syslog', '/tmp/radio.log', '/tmp/portal.key', '/etc/.secret', '/tmp/note12.txt', '/proc/version', '/proc/cpuinfo', '/dev/random', '/tmp/note1.txt', '/tmp/note6.txt'];
            for (let f of allFiles) {
                if (regex.test(f)) results.push(f);
            }
            return results.length ? results.join('\n') : 'Nenhum arquivo encontrado.';
        case 'ping':
            if (args.length === 0) return 'ping: uso: ping <host>';
            const host = args[0];
            if (host === 'gateway.portal') {
                return world.radioSynced ? 'PING gateway.portal (200.0.0.1): 56 bytes.\n64 bytes de 200.0.0.1: tempo=12.3 ms\nSinal estável.' : 'PING gateway.portal (200.0.0.1): destino inalcançável.';
            }
            return 'PING: host desconhecido.';
        case 'grep':
            if (args.length < 2) return 'grep: uso: grep <padrão> <arquivo>';
            const patternGrep = args[0];
            const fileGrep = args[1];
            if (fileGrep === 'syslog') {
                const content = processCommand(`cat syslog`);
                if (typeof content === 'string') {
                    const lines = content.split('\n').filter(line => line.includes(patternGrep));
                    if (lines.length > 0 && world.radioSynced && patternGrep.toLowerCase().includes('portal')) {
                        return lines.join('\n') + '\n1999-12-31 23:59:59 [INFO] Portal gateway respondendo em 200.0.0.1:1999';
                    }
                    return lines.join('\n') || 'Nenhuma ocorrência.';
                }
            }
            return 'grep: arquivo não suportado.';
        case 'tail':
            if (args.length < 2) return 'tail: uso: tail -n <N> <arquivo>';
            const n = parseInt(args[0]);
            const fileTail = args[1];
            if (fileTail === 'syslog') {
                const content = processCommand(`cat syslog`);
                if (typeof content === 'string') {
                    const lines = content.split('\n').slice(-n);
                    return lines.join('\n');
                }
            }
            return 'tail: arquivo não suportado.';
        case 'diff':
            if (args.length < 2) return 'diff: uso: diff <arquivo1> <arquivo2>';
            const file1 = args[0];
            const file2 = args[1];
            const content1 = processCommand(`cat ${file1}`);
            const content2 = processCommand(`cat ${file2}`);
            if (typeof content1 === 'string' && typeof content2 === 'string') {
                if (content1 === content2) return 'Arquivos idênticos.';
                else return 'Arquivos diferentes.';
            }
            return 'diff: erro ao comparar.';
        case 'chmod':
            if (args.length < 2) return 'chmod: uso: chmod <perm> <arquivo>';
            return `chmod: permissões alteradas para ${args[0]} em ${args[1]}. (Simulado)`;
        case 'man':
            if (args.length === 0) return 'man: uso: man <comando>';
            const manCmd = args[0];
            const manPages = {
                'ls': 'ls - lista arquivos do diretório.',
                'cat': 'cat - exibe o conteúdo de um arquivo.',
                'grep': 'grep - busca padrões em arquivos.',
                'tail': 'tail - exibe as últimas linhas de um arquivo.',
                'diff': 'diff - compara dois arquivos.',
                'chmod': 'chmod - altera permissões de arquivos (simulado).',
                'ping': 'ping - testa conectividade de rede.',
                'uptime': 'uptime - mostra tempo de atividade.',
                'df': 'df - mostra uso do disco.',
                'free': 'free - mostra uso da memória.',
                'uname': 'uname - informações do sistema.',
                'who': 'who - lista usuários logados.',
                'env': 'env - exibe variáveis de ambiente.',
                'echo': 'echo $VAR - exibe uma variável de ambiente.'
            };
            return manPages[manCmd] || 'Página de manual não encontrada.';
        case 'uptime':
            const up = Math.floor((Date.now() - world.startTime) / 1000);
            const h = Math.floor(up / 3600);
            const m = Math.floor((up % 3600) / 60);
            const s = up % 60;
            return `uptime: ${h}h ${m}m ${s}s, load average: 0.00, 0.01, 0.05`;
        case 'df':
            if (args.includes('-h')) {
                return `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       2.0G  1.2G  800M  60% /\n/dev/sda2       500M  100M  400M  20% /boot\nportal:/        infinite  --    --   --  /portal`;
            }
            return 'df: use df -h';
        case 'free':
            if (args.includes('-m')) {
                return `              total        used        free\nMem:           1024         512         512\nSwap:           256           0         256`;
            }
            return 'free: use free -m';
        case 'uname':
            if (args.includes('-a')) {
                return 'Linux portal 2.6.10-2000 #1 SMP Tue Dec 31 23:59:59 GMT 1999 i686 unknown';
            }
            if (args.includes('-r')) {
                return '2.6.10-2000';
            }
            return 'uname: use uname -a ou uname -r';
        case 'who':
            return 'root     pts/0        Dec 31 23:59\nportal   ?            Dec 31 00:00 (não identificado)';
        case 'env':
            let envVars = 'PORTAL_GATEWAY=200.0.0.1\nPORTAL_PORT=1999\nSESSION_KEY=???\nUSER=root\nHOME=/root\nPATH=/bin:/usr/bin:/usr/local/bin\n';
            if (world.radioSynced) envVars += 'FREQUENCY=1999\nSIGNAL=π\n';
            return envVars;
        case 'echo':
            if (args[0] === '$PORTAL_GATEWAY') {
                return '200.0.0.1';
            } else if (args[0] === '$PORTAL_PORT') {
                return '1999';
            } else if (args[0] === '$SESSION_KEY') {
                return '??? (encontre a chave)';
            } else if (args[0] === '$FREQUENCY' && world.radioSynced) {
                return '1999';
            } else {
                return args.join(' ');
            }
        case 'complete':
            const allCommands = ['help','ls','cat','date','clear','history','whoami','find','ping','grep','tail','diff','chmod','man','uptime','df','free','uname','who','env','echo','crash','shutdown','portal','1999','sintonizar','loop','meta','reboot','jogo','diario','decode'];
            const used = history.map(h => h.split(' ')[0].toLowerCase());
            const missing = allCommands.filter(cmd => !used.includes(cmd));
            if (missing.length === 0) {
                triggerFinal('MESTRE', 'Você dominou todos os comandos. O sistema reconhece seu conhecimento.');
            } else {
                return `Ainda falta você usar: ${missing.join(', ')}`;
            }
            return null;
        case 'diario':
            const notes = document.getElementById('notepadContent');
            if (notes) {
                notes.value += `\n\n--- DIÁRIO DE INVESTIGAÇÃO ---\n` +
                    `- Rádio: ${world.radioSynced ? 'Sincronizado' : 'Não sincronizado'}\n` +
                    `- Calendário: ${world.calendarMarked ? 'Marcado (31)' : 'Não marcado'}\n` +
                    `- IE: ${world.ieReopened ? 'Data alterada' : 'Original'}\n` +
                    `- Comandos usados: ${history.length}`;
                return 'Diário atualizado no bloco de notas.';
            }
            return 'Bloco de notas não aberto.';
        case 'jogo':
            return ticTacToe(args);
        case 'decode':
            if (args[0] === '--crypt') {
                const file = args[1];
                const key = args.slice(2).join(' ');
                if (file === 'segredo.crypt' && key === '2000_REVERSE') {
                    return 'Decodificado: "O portal está em 2000.REVERSE. A porta se abre em 31/12/1999."';
                } else if (file === 'mapa.crypt' && key === '1999') {
                    return 'Decodificado: "As coordenadas do portal: 20°00\'00"N 0°00\'00"E."';
                } else if (file === 'diario.crypt' && key === 'portal') {
                    return 'Decodificado: "O computador sabe que você está aqui. Ele está esperando."';
                }
                return 'Chave incorreta ou arquivo não encontrado.';
            }
            return 'Uso: decode --crypt <arquivo> <chave>';
        case 'crash':
            triggerBSOD();
            return null;
        case 'shutdown':
            triggerFinal('DESLIGAMENTO', 'Você desligou o sistema. O portal se fechou.');
            return null;
        case 'portal':
            if (world.radioSynced && world.calendarMarked && world.ieReopened) {
                triggerFinal('PORTAL', 'Você desbloqueou o portal. O ano 2000 se torna eterno.');
            } else {
                return 'ACESSO NEGADO. Sinal instável.';
            }
            return null;
        case '1999':
            if (world.calendarMarked) {
                triggerFinal('VIAJANTE', 'Você viajou para 31/12/1999. O portal se abriu.');
            } else {
                return 'Você precisa marcar o calendário primeiro.';
            }
            return null;
        case 'sintonizar':
            if (world.radioSynced) {
                triggerFinal('SINTONIA', 'Você sintonizou a frequência correta. O rádio responde.');
            } else {
                return 'Você precisa sintonizar o rádio em 1999 Hz.';
            }
            return null;
        case 'loop':
            location.reload();
            return null;
        case 'meta':
            triggerFinal('META', 'Você quebrou a quarta parede. O sistema reconhece você.');
            return null;
        case 'reboot':
            if (document.querySelector('.bsod.active')) {
                location.reload();
            } else {
                return 'Comando disponível apenas durante o BSOD.';
            }
            return null;
        default:
            world.invalidCommands++;
            if (world.invalidCommands > 5) {
                return 'Você realmente está tentando?';
            }
            return `comando '${c}' não reconhecido.`;
    }
}

// ==========================================================================
// JOGO DA VELHA
// ==========================================================================
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttTurn = 'X';
let tttGameOver = false;

function ticTacToe(args) {
    if (args.length === 0) {
        return 'Jogo da velha. Use "jogo <posição>" (1-9) para jogar.\nEx: jogo 5\nTabuleiro:\n' + renderBoard();
    }
    const pos = parseInt(args[0]) - 1;
    if (isNaN(pos) || pos < 0 || pos > 8 || tttBoard[pos] !== '') {
        return 'Posição inválida ou ocupada.';
    }
    if (tttGameOver) {
        tttBoard = ['', '', '', '', '', '', '', '', ''];
        tttTurn = 'X';
        tttGameOver = false;
        return 'Novo jogo iniciado.';
    }
    tttBoard[pos] = 'X';
    if (checkWin('X')) {
        tttGameOver = true;
        return 'Você venceu! Parabéns! (Isso é estranho...)';
    }
    if (tttBoard.every(cell => cell !== '')) {
        tttGameOver = true;
        return 'Empate! (O computador não perde.)';
    }
    let bestMove = minimax(tttBoard, 'O').index;
    if (bestMove !== undefined) {
        tttBoard[bestMove] = 'O';
    }
    if (checkWin('O')) {
        tttGameOver = true;
        return 'O computador venceu! (Como esperado.)\n' + renderBoard();
    }
    if (tttBoard.every(cell => cell !== '')) {
        tttGameOver = true;
        return 'Empate! (O computador não perde.)\n' + renderBoard();
    }
    return 'Sua vez:\n' + renderBoard();
}

function renderBoard() {
    let board = '';
    for (let i = 0; i < 9; i++) {
        board += (tttBoard[i] || ' ') + ' ';
        if (i % 3 === 2) board += '\n';
    }
    return board;
}

function checkWin(player) {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return winPatterns.some(pattern => pattern.every(i => tttBoard[i] === player));
}

function minimax(board, player) {
    const available = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
    if (checkWin('X')) return { score: -10 };
    if (checkWin('O')) return { score: 10 };
    if (available.length === 0) return { score: 0 };
    const moves = [];
    for (let i of available) {
        const move = { index: i };
        board[i] = player;
        const result = minimax(board, player === 'O' ? 'X' : 'O');
        move.score = result.score;
        board[i] = '';
        moves.push(move);
    }
    if (player === 'O') {
        const best = moves.reduce((best, move) => move.score > best.score ? move : best, { score: -Infinity });
        return best;
    } else {
        const best = moves.reduce((best, move) => move.score < best.score ? move : best, { score: Infinity });
        return best;
    }
}

// ==========================================================================
// RÁDIO
// ==========================================================================
function initRadio() {
    const canvas = document.getElementById('radioCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('freqSlider');
    const display = document.getElementById('freqDisplay');

    function resizeCanvas() {
        const parent = canvas.parentNode;
        const rect = parent.getBoundingClientRect();
        const containerWidth = rect.width - 4;
        canvas.width = containerWidth;
        canvas.height = 100;
    }

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(canvas.parentNode);
    window._radioResizeObserver = resizeObserver;

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const freq = parseInt(slider.value);
        display.innerText = freq + ' Hz';
        for (let x = 0; x < canvas.width; x++) {
            const y = canvas.height/2 + Math.sin(x * 0.02 + freq * 0.001) * 20;
            ctx.fillStyle = `hsl(${x * 0.5 + freq/10}, 100%, 50%)`;
            ctx.fillRect(x, y, 1, 1);
        }
        if (world.radioSynced) {
            ctx.fillStyle = '#ff00ff';
            ctx.font = '10px monospace';
            ctx.fillText('—', canvas.width/2, 50);
        }
        if (world.radioPlaying) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 10, 10);
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function toggleRadio() {
    if (world.radioPlaying) {
        stopRadio();
        const btn = document.querySelector('#radio .body button');
        if (btn) btn.innerText = 'LIGAR';
        const status = document.getElementById('radioStatus');
        if (status) status.innerText = 'Estático';
        return;
    }
    
    const slider = document.getElementById('freqSlider');
    if (!slider) return;
    const freq = parseInt(slider.value);

    if (world.radioCtx && world.radioCtx.state === 'suspended') {
        world.radioCtx.resume();
    }

    if (freq >= 1995 && freq <= 2005) {
        if (!world.radioSynced) {
            world.radioSynced = true;
            saveWorld();
            document.querySelectorAll('.titlebar .sysicon').forEach(el => {
                el.innerText = 'π';
                el.classList.add('synced');
            });
            playTune();
        }
        const status = document.getElementById('radioStatus');
        if (status) status.innerText = 'Sinal π captado.';
    } else {
        world.radioSynced = false;
        const status = document.getElementById('radioStatus');
        if (status) status.innerText = 'Estático';
        document.querySelectorAll('.titlebar .sysicon').forEach(el => {
            el.innerText = '●';
            el.classList.remove('synced');
        });
    }

    if (!world.radioCtx) world.radioCtx = new (window.AudioContext || window.webkitAudioContext)();
    world.radioOsc = world.radioCtx.createOscillator();
    world.radioGain = world.radioCtx.createGain();
    world.radioOsc.type = 'sawtooth';
    world.radioOsc.frequency.value = freq;
    world.radioGain.gain.value = 0.03;
    world.radioOsc.connect(world.radioGain);
    world.radioGain.connect(world.radioCtx.destination);
    world.radioOsc.start();

    world.radioPlaying = true;
    const btn = document.querySelector('#radio .body button');
    if (btn) btn.innerText = 'DESLIGAR';
}

function stopRadio() {
    if (world.radioOsc) { 
        try { world.radioOsc.stop(); } catch(e) {}
        world.radioOsc = null; 
    }
    if (window._radioAnimFrame) {
        cancelAnimationFrame(window._radioAnimFrame);
        window._radioAnimFrame = null;
    }
    world.radioPlaying = false;
}

// ==========================================================================
// CALENDÁRIO
// ==========================================================================
function getRealDateMessage() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if (month === 12 && day === 24) {
        return { message: '🎄 24/12 – Véspera de Natal. O sistema parece mais quieto hoje.', color: '#00ff41' };
    } else if (month === 12 && day === 25) {
        return { message: '🎅 25/12 – Natal. O portal está silencioso. Ou será que não?', color: '#ff00ff' };
    } else if (month === 12 && day === 31) {
        return { message: '🎆 31/12 – Virada do milênio. O portal está prestes a se abrir.', color: '#ff0000' };
    } else if (month === 12 && day === 1) {
        return { message: '📅 01/12 – Início do último mês de 1999. O tempo está se esgotando.', color: '#00ffff' };
    }
    return null;
}

function buildCalendarHTML() {
    const realMsg = getRealDateMessage();
    let headerMsg = '';
    if (realMsg) {
        headerMsg = `<div style="color:${realMsg.color}; text-align:center; margin-bottom:10px; font-size:1.1em; border:1px solid ${realMsg.color}; padding:5px; background:rgba(0,0,0,0.5);">${realMsg.message}</div>`;
    }
    const startDay = 3;
    let grid = `<div class="calendar-grid">`;
    ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].forEach(d => grid += `<span style="font-weight:bold;">${d}</span>`);
    grid += `</div>`;
    let dayCount = 0;
    for (let row = 0; row < 6; row++) {
        grid += `<div class="calendar-grid">`;
        for (let col = 0; col < 7; col++) {
            if (row === 0 && col < 3) {
                grid += `<span></span>`;
            } else if (dayCount < 31) {
                dayCount++;
                let extra = '';
                let onclick = '';
                if (dayCount === 31 && world.calendarMarked) {
                    extra = ' style="color:#00ff41; font-weight:bold;"';
                } else if (dayCount === 31) {
                    onclick = ` onclick="calendarClick(31)"`;
                    extra = ' class="calendar-day" style="color:#ff0000;"';
                } else if (dayCount === 24 && world.calendarMarked24) {
                    extra = ' style="color:#00ff41; font-weight:bold;"';
                } else if (dayCount === 24) {
                    onclick = ` onclick="calendarClick(24)"`;
                    extra = ' class="calendar-day" style="color:#ffff00;"';
                } else if (dayCount === 12 && world.calendarMarked12) {
                    extra = ' style="color:#00ff41; font-weight:bold;"';
                } else if (dayCount === 12) {
                    onclick = ` onclick="calendarClick(12)"`;
                    extra = ' class="calendar-day" style="color:#00ffff;"';
                } else if (dayCount === 25 && world.calendarMarked25) {
                    extra = ' style="color:#ff00ff; font-weight:bold;"';
                } else if (dayCount === 25) {
                    onclick = ` onclick="calendarClick(25)"`;
                    extra = ' class="calendar-day" style="color:#ff00ff;"';
                } else if (dayCount === 1 && world.calendarMarked1) {
                    extra = ' style="color:#00ffff; font-weight:bold;"';
                } else if (dayCount === 1) {
                    onclick = ` onclick="calendarClick(1)"`;
                    extra = ' class="calendar-day" style="color:#00ffff;"';
                } else if (dayCount === 6 && world.calendarMarked6) {
                    extra = ' style="color:#00ffff; font-weight:bold;"';
                } else if (dayCount === 6) {
                    onclick = ` onclick="calendarClick(6)"`;
                    extra = ' class="calendar-day" style="color:#00ffff;"';
                }
                grid += `<span${extra}${onclick}>${dayCount}</span>`;
            } else {
                grid += `<span></span>`;
            }
        }
        grid += `</div>`;
    }
    return headerMsg + grid;
}

function calendarClick(day) {
    if (day === 31 && !world.calendarMarked) {
        world.calendarMarked = true;
        saveWorld();
        updateCalendar();
    } else if (day === 24 && !world.calendarMarked24) {
        world.calendarMarked24 = true;
        saveWorld();
        updateCalendar();
    } else if (day === 12 && !world.calendarMarked12) {
        world.calendarMarked12 = true;
        saveWorld();
        updateCalendar();
    } else if (day === 25 && !world.calendarMarked25) {
        world.calendarMarked25 = true;
        saveWorld();
        updateCalendar();
        const out = document.getElementById('termOut');
        if (out) out.innerHTML += `<br><span style="color:#ff00ff;">[SYS] 25/12 – O silêncio é ensurdecedor.</span>`;
    } else if (day === 1 && !world.calendarMarked1) {
        world.calendarMarked1 = true;
        saveWorld();
        updateCalendar();
    } else if (day === 6 && !world.calendarMarked6) {
        world.calendarMarked6 = true;
        saveWorld();
        updateCalendar();
    }
}

function updateCalendar() {
    const container = document.getElementById('calContainer');
    if (container) {
        container.innerHTML = `<h3 style="text-align:center; color:#ffff00; margin-bottom:10px;">DEZEMBRO 1999</h3>${buildCalendarHTML()}`;
    }
}

// ==========================================================================
// BSOD E FINAIS
// ==========================================================================
function triggerBSOD() {
    const bsod = document.getElementById('bsod');
    if (!bsod) {
        // Cria a BSOD dinamicamente com estilo mais autêntico
        const bsodDiv = document.createElement('div');
        bsodDiv.className = 'bsod active';
        bsodDiv.id = 'bsod';
        bsodDiv.innerHTML = `
            <div style="font-family:'VT323'; font-size:1.2em; max-width:700px; text-align:left;">
                <div style="font-family:'Press Start 2P'; font-size:2.5em; color:#fff; margin-bottom:20px;">:(</div>
                <div style="font-size:1.5em; color:#fff; margin-bottom:15px;">O sistema encontrou um problema e precisa ser reiniciado.</div>
                <div style="color:#ffff00; margin:15px 0;">ERRO: Y2K_CRITICAL_FAILURE (0x00002000)</div>
                <div style="font-size:0.9em; color:#ccc; line-height:1.5;">
                    <p>Informações técnicas:</p>
                    <p>*** STOP: 0x0000007E (0x80000003, 0x8055B5A0, 0xF79D84A4, 0xF79D81A4)</p>
                    <p>PROJETO_2000.SYS - Endereço F79D84A4 base em F79D7000</p>
                    <div style="margin-top:20px;">
                        <p>Despejando memória física... <span id="dumpProgress">0%</span></p>
                        <div style="width:100%; height:10px; background:#333; border:1px solid #fff;">
                            <div id="dumpBar" style="width:0%; height:100%; background:#00ff00; transition: width 0.1s;"></div>
                        </div>
                    </div>
                    <div id="rebootCountdown" style="margin-top:20px; color:#ffff00; font-size:1.2em;">Reiniciando em 15 segundos...</div>
                </div>
                <div style="margin-top:30px; font-size:0.8em; color:#aaa;">Digite 'reboot' para reiniciar imediatamente.</div>
            </div>
        `;
        document.querySelector('.bios-container').appendChild(bsodDiv);
    }

    document.getElementById('bsod').style.display = 'flex';
    world.isFrozen = true;
    if (world.radioPlaying) stopRadio();

    // Simula o despejo de memória e contagem regressiva
    let progress = 0;
    const progressSpan = document.getElementById('dumpProgress');
    const progressBar = document.getElementById('dumpBar');
    const countdownSpan = document.getElementById('rebootCountdown');
    let countdown = 15;

    const dumpInterval = setInterval(() => {
        progress += Math.random() * 5 + 1;
        if (progress > 100) progress = 100;
        progressSpan.innerText = Math.floor(progress) + '%';
        progressBar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(dumpInterval);
            // Inicia contagem regressiva
            const countInterval = setInterval(() => {
                countdown--;
                countdownSpan.innerText = `Reiniciando em ${countdown} segundos...`;
                if (countdown <= 0) {
                    clearInterval(countInterval);
                    location.reload();
                }
            }, 1000);
        }
    }, 150);
}

function triggerFinal(title, desc) {
    if (world.finalTriggered) return;
    world.finalTriggered = true;
    world.isFrozen = true;
    if (world.radioPlaying) stopRadio();
    playSuccess();
    const finalDiv = document.createElement('div');
    finalDiv.className = 'window active';
    finalDiv.style.position = 'fixed';
    finalDiv.style.top = '50%';
    finalDiv.style.left = '50%';
    finalDiv.style.transform = 'translate(-50%, -50%)';
    finalDiv.style.width = '500px';
    finalDiv.style.height = '300px';
    finalDiv.style.zIndex = '999999';
    finalDiv.style.background = '#0a0a0a';
    finalDiv.style.border = '2px solid #00ff41';
    finalDiv.style.boxShadow = '0 0 100px #00ff41';
    finalDiv.style.padding = '20px';
    finalDiv.style.textAlign = 'center';
    finalDiv.style.display = 'flex';
    finalDiv.style.flexDirection = 'column';
    finalDiv.style.justifyContent = 'center';
    finalDiv.style.alignItems = 'center';
    finalDiv.innerHTML = `
                <h2 style="color:#ff00ff;">${title}</h2>
                <p style="color:#00ff41; margin-top:20px;">${desc}</p>
                <button onclick="location.reload()" style="margin-top:30px; background:#000; border:1px solid #ff00ff; color:#ff00ff; padding:10px 20px; font-family:'Press Start 2P'; cursor:pointer;">REINICIAR</button>
            `;
    document.body.appendChild(finalDiv);
}

// ==========================================================================
// RELÓGIO E NORMALIZAÇÃO
// ==========================================================================
let clockInterval = null;
let sessionTimer = null;
let normalizationTimers = [];

function initClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;

    sessionTimer = setInterval(() => {
        world.sessionTime++;
        const notepad = document.getElementById('notepadContent');
        const notepadWin = document.getElementById('notepad');
        if (notepad && notepadWin && notepadWin.classList.contains('active')) {
            let baseNotes = 'Anotações esparsas:\n- O som está em algum lugar.\n- O calendário não parece confiável.';
            if (world.noteLinesAdded.includes('reading_again')) {
                baseNotes += `\n- Você está lendo isso novamente.`;
            }
            if (world.noteLinesAdded.includes('day12')) {
                baseNotes += `\n- O dia 12 tem uma nota: "A porta está em 1999."`;
            }
            if (world.noteLinesAdded.includes('radio_constant')) {
                baseNotes += `\n- O rádio emite um som constante. Não consigo ignorar.`;
            }
            if (world.sessionTime > 240 && !world.noteLinesAdded.includes('story1')) {
                baseNotes += `\n- 1999. O último ano. O portal se aproxima.`;
                world.noteLinesAdded.push('story1');
                saveWorld();
            }
            if (world.sessionTime > 360 && !world.noteLinesAdded.includes('story2')) {
                baseNotes += `\n- Eles estão me ouvindo. O rádio é a chave.`;
                world.noteLinesAdded.push('story2');
                saveWorld();
            }
            if (world.sessionTime > 480 && !world.noteLinesAdded.includes('story3')) {
                baseNotes += `\n- 31/12/1999. Não há mais tempo. A porta se abrirá.`;
                world.noteLinesAdded.push('story3');
                saveWorld();
            }
            if (notepad.value !== baseNotes) {
                notepad.value = baseNotes;
            }
        }
        if (Math.random() > 0.95 && !world.isFrozen) {
            const out = document.getElementById('termOut');
            if (out) {
                const msgs = [
                    '[KERNEL] Falha ao acessar o dispositivo portal.',
                    '[CRITICAL] Tempo de vida do sistema: 2000 horas.',
                    '[WARN] Conexão com gateway.portal instável.',
                    '[INFO] Atualizando calendário interno...',
                    '[ERROR] Não foi possível decodificar o sinal.'
                ];
                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                out.innerHTML += `<br><span style="color:#ff8888;">${msg}</span>`;
            }
        }
    }, 1000);

    setTimeout(() => {
        document.getElementById('crtEffect').classList.add('crt-faded');
    }, 30000);
    setTimeout(() => {
        document.getElementById('crtEffect').style.opacity = '0.05';
    }, 60000);
    setTimeout(() => {
        if (!world.isFrozen) {
            world.isFrozen = true;
            clock.style.color = '#555';
            clock.innerText = '00:00:00';
            setTimeout(() => triggerBSOD(), 5000);
        }
    }, 90000);

    clockInterval = setInterval(() => {
        if (!world.isFrozen) {
            const now = new Date();
            clock.innerText = now.toLocaleTimeString();
        }
    }, 1000);
}

window.addEventListener('beforeunload', () => {
    if (clockInterval) clearInterval(clockInterval);
    if (sessionTimer) clearInterval(sessionTimer);
    normalizationTimers.forEach(t => clearTimeout(t));
    if (world.radioPlaying) stopRadio();
    if (ambientOsc) { ambientOsc.stop(); ambientOsc = null; }
    if (ambientInterval) clearInterval(ambientInterval);
});
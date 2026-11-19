(function() {
  const connStatus = document.getElementById('conn-status');
  const gearEl = document.getElementById('gear');
  const speedEl = document.getElementById('speed');
  const rpmEl = document.getElementById('rpm');
  const rpmFill = document.getElementById('rpm-fill');

  let ws = null;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}`);

    ws.onopen = () => {
      connStatus.textContent = 'Live 60Hz';
      connStatus.classList.add('connected');
    };

    ws.onclose = () => {
      connStatus.textContent = 'Disconnected';
      connStatus.classList.remove('connected');
      setTimeout(connect, 2000);
    };

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        if (d.gear !== undefined) {
          gearEl.textContent = d.gear === 0 ? 'N' : d.gear === -1 ? 'R' : d.gear;
        }
        if (d.speed !== undefined || d.speedKmh !== undefined) {
          speedEl.textContent = Math.round(d.speed || d.speedKmh || 0);
        }
        if (d.rpm !== undefined) {
          rpmEl.textContent = Math.round(d.rpm);
          const maxRpm = d.maxRpm || 8000;
          const ratio = Math.min(100, Math.max(0, (d.rpm / maxRpm) * 100));
          rpmFill.style.width = `${ratio}%`;
        }
      } catch (e) {}
    };
  }

  connect();
})();

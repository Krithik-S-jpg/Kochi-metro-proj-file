document.addEventListener("DOMContentLoaded", () => {
    const layers = document.querySelectorAll(".layer");
  
    // Set initial positions from localStorage if available
    layers.forEach(layer => {
      const saved = localStorage.getItem(layer.dataset.name);
      if (saved) {
        const pos = JSON.parse(saved);
        layer.style.left = pos.left;
        layer.style.top = pos.top;
        layer.style.width = pos.width;
        layer.style.zIndex = pos.zIndex;
        layer.style.transform = `scale(${pos.scale || 1})`; // preserve scale if saved
      }
    });
  
    // Parallax effect based on mouse movement
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // range -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
  
      layers.forEach(layer => {
        const depth = parseFloat(layer.getAttribute('data-depth')) || 0;
        const moveX = x * depth * 40;
        const moveY = y * depth * 40;
  
        // Preserve existing transforms (scale, etc.)
        const existingTransform = layer.style.transform.replace(/translate\(.*?\)/, '').trim();
  
        layer.style.transform = `${existingTransform} translate(${moveX}px, ${moveY}px)`;
      });
    });
  });
  
  const stations = [
    { name: "Aluva", x: 250, y: 250 },
    { name: "Pulinchodu", x: 160, y: 300 },
    { name: "Companypady", x: 210, y: 420 },
    { name: "Muttom", x: 280, y: 485 },
    { name: "Kalamassery", x: 340, y: 550 },
    { name: "Cochin University", x: 420, y: 600 },
    { name: "Edapally", x: 520, y: 650 },
    { name: "Palarivattom", x: 740, y: 650 },
    { name: "Jubilee", x: 800, y: 600 },
    { name: "Lissie", x: 880, y: 550 },
    { name: "M.G. Road", x: 950, y: 485 },
    { name: "Kaloor", x: 1000, y: 420 }
  ];
  
  const container = document.querySelector(".metro-container");
  
  stations.forEach(station => {
    const label = document.createElement("div");
    label.className = "station-label";
    label.textContent = station.name;
    container.appendChild(label);
  
    // Set position
    label.style.position = "absolute";
    label.style.left = station.x + "px";
    label.style.top = station.y + "px";
    label.style.color = "#000";
    label.style.background = "rgba(255,255,255,0.8)";
    label.style.padding = "2px 6px";
    label.style.borderRadius = "4px";
    label.style.fontSize = "12px";
  });
  
// Tasmanian Ecosystem Simulator - Enhanced Version
let grass, pademelons, devils, bandicoots, chart;
let season = 0; // 0: Spring, 1: Summer, 2: Autumn, 3: Winter
let seasonDuration = 300;
let showSeasons = true;
let showDisasters = true;
let disasterDuration = 100;
let disasterFrame = -disasterDuration;
let isPaused = false;
let grassLimitEnabled = true;
let points = 0;
let stabilityCheckFrames = 0;
const stabilityThreshold = 1000;
const stabilityPoints = 50;
const rangerBadgePoints = 1500;
let rangerBadgeAchieved = false;
let rangerBadgeMessageShown = false;

// Speed control
let speedMultiplier = 1;
let lastFrameTime = performance.now();
let customFrameCount = 0;

// Ecological metrics
let biodiversityIndex = 0;
let ecosystemHealth = 100;
let maxGrass = 0;
let maxPademelons = 0;
let maxDevils = 0;
let maxBandicoots = 0;

// Learning objectives
let objectives = [
  { description: "Increase pademelon population to 200", target: 200, achieved: false, points: 200, type: "pademelons" },
  { description: "Maintain devil population > 100 with grass > 400", target: 100, achieved: false, points: 300, type: "apex_stability" },
  { description: "Trigger bandicoot-driven grass recovery (50% increase)", target: 1.5, achieved: false, points: 200, type: "keystone_effect" },
  { description: "Survive 8 natural disasters", target: 8, achieved: false, points: 100, count: 0, type: "disasters" },
  { description: "Maintain biodiversity index > 0.7 for 1000 frames", target: 1000, achieved: false, points: 150, type: "biodiversity" }
];

let ongoingObjectives = [
  { description: "Keep grass population > 700 for 800 frames", target: 800, achieved: false, points: 300, type: "grass", condition: (g) => g > 700 },
  { description: "Keep devil population > 70 for 800 frames", target: 800, achieved: false, points: 300, type: "devils", condition: (d) => d > 70 },
  { description: "Maintain balanced ecosystem for 1500 frames", target: 1500, achieved: false, points: 500, type: "balanced", 
    condition: (g, p, d, b) => g > 500 && p > 100 && d > 50 && b > 100 }
];

let achievements = [
  { description: "Ecosystem Guardian: Achieve all ongoing objectives", achieved: false, points: 500 },
  { description: "Devil Advocate: Maintain healthy devil population for 5000 frames", achieved: false, frames: 0, target: 5000, points: 300 },
  { description: "Keystone Keeper: Double bandicoot population from starting value", achieved: false, target: 60, points: 200 }
];

let populationHistory = [];
const historyLength = 200;

// Seasonal parameters
let seasonParams = [
  { name: "Spring", rainfall: 70, temperature: 20, color: "#d4f1f4" },
  { name: "Summer", rainfall: 30, temperature: 35, color: "#f7d794" },
  { name: "Autumn", rainfall: 50, temperature: 15, color: "#f5cd79" },
  { name: "Winter", rainfall: 40, temperature: 5, color: "#c8d6e5" }
];

// Interpolation variables
let targetRainfall, targetTemperature;
let currentRainfall, currentTemperature;
const interpolationSpeed = 0.01;

function setup() {
  let canvas = createCanvas(800, 400);
  canvas.parent("canvas-container");
  
  // Initialize chart
  initChart();
  
  // Set up controls
  initControls();
  
  resetSim();
  
  // Start game loop
  requestAnimationFrame(gameLoop);
}

function initChart() {
  const ctx = document.getElementById('populationChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: "Grass", data: [], borderColor: "#4CAF50", fill: false },
        { label: "Pademelons", data: [], borderColor: "#FF9800", fill: false },
        { label: "Devils", data: [], borderColor: "#F44336", fill: false },
        { label: "Bandicoots", data: [], borderColor: "#FFEB3B", fill: false }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      scales: {
        x: { title: { display: true, text: 'Time' }},
        y: { 
          title: { display: true, text: 'Population' },
          min: 0
        }
      }
    }
  });
}

function initControls() {
  // Speed control
  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");
  speedSlider.addEventListener("input", () => {
    speedMultiplier = parseFloat(speedSlider.value);
    speedValue.textContent = speedMultiplier.toFixed(1) + "x";
  });

  // Slider value updates
  document.querySelectorAll("input[type='range']").forEach(slider => {
    slider.addEventListener("input", function() {
      document.getElementById(this.id + 'Value').textContent = this.value;
    });
  });

  // Button events
  document.getElementById("pauseButton").addEventListener("click", togglePause);
  document.getElementById("resetButton").addEventListener("click", resetSim);
  document.getElementById("toggleSeasons").addEventListener("change", toggleSeasonsDisplay);
  document.getElementById("toggleDisasters").addEventListener("change", toggleDisasters);
  document.getElementById("toggleGrassLimitButton").addEventListener("click", toggleGrassLimit);
  document.getElementById("exportCSV").addEventListener("click", exportCSV);
  
  // Collapsible sections
  document.querySelectorAll(".collapsible").forEach(button => {
    button.addEventListener("click", function() {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
        this.setAttribute("aria-expanded", "false");
      } else {
        content.style.display = "block";
        this.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function resetSim() {
  // Reset populations
  grass = 100;
  pademelons = 50;
  devils = 10;
  bandicoots = 30;
  
  // Reset tracking variables
  customFrameCount = 0;
  lastFrameTime = performance.now();
  points = 0;
  ecosystemHealth = 100;
  biodiversityIndex = 0;
  maxGrass = 0;
  maxPademelons = 0;
  maxDevils = 0;
  maxBandicoots = 0;
  
  // Reset objectives
  objectives.forEach(obj => obj.achieved = false);
  ongoingObjectives.forEach(obj => {
    obj.achieved = false;
    obj.target = obj.type === "balanced" ? 1500 : 800;
  });
  achievements.forEach(ach => ach.achieved = false);
  
  // Reset chart
  if (chart) {
    chart.data.labels = [];
    chart.data.datasets.forEach(dataset => dataset.data = []);
    chart.update();
  }
  
  populationHistory = [];
  
  // Reset sliders to default
  document.getElementById("rainfall").value = 50;
  document.getElementById("rainfallValue").textContent = "50";
  document.getElementById("temperature").value = 20;
  document.getElementById("temperatureValue").textContent = "20";
  document.getElementById("invasiveSpecies").value = 5;
  document.getElementById("invasiveSpeciesValue").textContent = "5";
  document.getElementById("humanImpact").value = 2;
  document.getElementById("humanImpactValue").textContent = "2";
  
  // Reset season
  season = 0;
  targetRainfall = currentRainfall = seasonParams[season].rainfall;
  targetTemperature = currentTemperature = seasonParams[season].temperature;
  document.getElementById("seasonDisplay").textContent = "Season: " + seasonParams[season].name;
  
  updateUI();
}

function gameLoop(timestamp) {
  if (!isPaused) {
    const deltaTime = timestamp - lastFrameTime;
    
    if (deltaTime >= (16 / speedMultiplier)) {
      update();
      draw();
      customFrameCount++;
      lastFrameTime = timestamp;
    }
  }
  requestAnimationFrame(gameLoop);
}

function update() {
  // Seasonal changes
  updateSeasons();
  
  // Get environmental factors
  const rainfall = getModifiedRainfall();
  const temperature = getModifiedTemperature();
  const invasiveSpecies = parseFloat(document.getElementById("invasiveSpecies").value);
  const humanImpact = parseFloat(document.getElementById("humanImpact").value);
  
  // Update populations
  updateGrass(rainfall, invasiveSpecies);
  updatePademelons(temperature, humanImpact, invasiveSpecies);
  updateBandicoots(temperature, invasiveSpecies, humanImpact);
  updateDevils(humanImpact, temperature);
  
  // Apply population limits
  enforceLimits();
  
  // Track history for stability checks
  updateHistory();
  
  // Check for events and objectives
  checkRandomEvents();
  checkObjectives();
  updateEcosystemMetrics();
}

function updateSeasons() {
  if (customFrameCount % seasonDuration === 0) {
    season = (season + 1) % 4;
    document.getElementById("seasonDisplay").textContent = `Season: ${seasonParams[season].name}`;
    targetRainfall = seasonParams[season].rainfall;
    targetTemperature = seasonParams[season].temperature;
  }
  
  // Smooth seasonal transitions
  currentRainfall += (targetRainfall - currentRainfall) * interpolationSpeed;
  currentTemperature += (targetTemperature - currentTemperature) * interpolationSpeed;
}

function getModifiedRainfall() {
  const rainfallSlider = parseFloat(document.getElementById("rainfall").value) - 50;
  return currentRainfall + rainfallSlider;
}

function getModifiedTemperature() {
  const tempSlider = parseFloat(document.getElementById("temperature").value) - 20;
  return currentTemperature + tempSlider;
}

function updateGrass(rainfall, invasiveSpecies) {
  // Base growth affected by rainfall and bandicoots (keystone effect)
  const bandicootEffect = 1 + (bandicoots * 0.002); // Bandicoots improve grass growth
  const growthRate = (rainfall / 20) * bandicootEffect;
  
  // Loss from pademelons grazing and invasive species
  const lossRate = (pademelons / 25) + (invasiveSpecies / 2);
  
  // Update grass population
  grass += growthRate - lossRate;
  grass = max(grass, 0);
  
  // Track max grass for objectives
  if (grass > maxGrass) maxGrass = grass;
}

function updatePademelons(temperature, humanImpact, invasiveSpecies) {
  // Growth depends on available grass
  const growthRate = grass / 200;
  
  // Losses from predation, environment, and humans
  const predationLoss = devils / 8;
  const tempStress = temperature > 25 ? (temperature - 25) / 10 : 0;
  const humanLoss = humanImpact / 3;
  const invasiveLoss = invasiveSpecies / 8;
  
  pademelons += growthRate - predationLoss - tempStress - humanLoss - invasiveLoss;
  pademelons = max(pademelons, 0);
  
  if (pademelons > maxPademelons) maxPademelons = pademelons;
}

function updateBandicoots(temperature, invasiveSpecies, humanImpact) {
  // Bandicoots benefit from grass but compete with pademelons
  const resourceAvailability = (grass / 300) - (pademelons / 400);
  const tempEffect = temperature > 30 ? -(temperature - 30) / 15 : 0;
  
  // Threats from devils and human impact
  const predationRisk = devils / 15;
  const humanThreat = humanImpact / 4;
  const invasiveThreat = invasiveSpecies / 6;
  
  bandicoots += resourceAvailability - predationRisk - humanThreat - invasiveThreat + tempEffect;
  bandicoots = max(bandicoots, 0);
  
  if (bandicoots > maxBandicoots) maxBandicoots = bandicoots;
}

function updateDevils(humanImpact, temperature) {
  // Devils primarily depend on pademelons but will scavenge
  const foodAvailability = (pademelons / 70) + (bandicoots / 100);
  
  // Carrying capacity based on available prey
  const carryingCapacity = (pademelons + bandicoots) * 0.4;
  const densityDependence = 1 - (devils / (carryingCapacity + 1));
  
  // Environmental stresses
  const tempStress = abs(temperature - 20) / 15;
  const humanStress = humanImpact / 3;
  
  devils += foodAvailability * densityDependence - tempStress - humanStress;
  devils = max(devils, 0);
  
  if (devils > maxDevils) maxDevils = devils;
}

function enforceLimits() {
  // Apply carrying capacities
  if (grassLimitEnabled) grass = constrain(grass, 0, 1500);
  
  // Devils can't exceed prey-based capacity
  const devilCapacity = (pademelons + bandicoots) * 0.5;
  devils = min(devils, devilCapacity);
  
  // Bandicoots have grass-dependent limit
  const bandicootCapacity = grass * 0.15;
  bandicoots = min(bandicoots, bandicootCapacity);
}

function updateHistory() {
  // Record current state
  populationHistory.push({
    frame: customFrameCount,
    grass: grass,
    pademelons: pademelons,
    devils: devils,
    bandicoots: bandicoots
  });
  
  // Trim history
  if (populationHistory.length > historyLength) {
    populationHistory.shift();
  }
  
  // Update chart data
  chart.data.labels.push(customFrameCount);
  chart.data.datasets[0].data.push(grass);
  chart.data.datasets[1].data.push(pademelons);
  chart.data.datasets[2].data.push(devils);
  chart.data.datasets[3].data.push(bandicoots);
  
  if (chart.data.labels.length > 100) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(dataset => dataset.data.shift());
  }
}

function checkRandomEvents() {
  if (showDisasters && customFrameCount % 1000 === 0 && random() < 0.3) {
    triggerRandomEvent();
  }
  
  // Educational narrative events
  if (customFrameCount % 750 === 0) {
    triggerNarrativeEvent();
  }
}

function triggerRandomEvent() {
  const events = [
    { 
      name: "Bushfire", 
      effect: () => {
        grass *= 0.3;
        pademelons *= 0.7;
        devils *= 0.9; // Devils can scavenge after fires
        showEventMessage("Bushfire! Grass and pademelon populations severely impacted.", "#ff5722");
      }
    },
    {
      name: "Devil Facial Tumor Disease",
      effect: () => {
        const diseaseSeverity = random(0.3, 0.7);
        devils *= (1 - diseaseSeverity);
        bandicoots *= (1 + diseaseSeverity * 0.5); // Bandicoots benefit from reduced predation
        showEventMessage(`Devil disease outbreak! ${Math.round(diseaseSeverity * 100)}% of devils affected.`, "#9c27b0");
      }
    },
    {
      name: "Drought",
      effect: () => {
        targetRainfall *= 0.4;
        showEventMessage("Severe drought! Rainfall drastically reduced.", "#2196f3");
      }
    }
  ];
  
  const event = random(events);
  event.effect();
  disasterFrame = customFrameCount;
  
  // Update disaster counters
  const disasterObj = objectives.find(obj => obj.type === "disasters");
  if (disasterObj) disasterObj.count++;
}

function triggerNarrativeEvent() {
  const messages = [];
  
  if (grass < 100 && pademelons > 150) {
    messages.push("Overgrazing alert! Pademelons are consuming grass faster than it can regrow.");
  }
  
  if (devils > 100 && pademelons < 80) {
    messages.push("Predator pressure! High devil populations are suppressing pademelon numbers.");
  }
  
  if (bandicoots < 20 && grass > 300) {
    messages.push("Keystone species decline: Low bandicoot numbers may lead to reduced soil health.");
  }
  
  if (messages.length > 0) {
    showNarrativeMessage(random(messages));
  }
}

function checkObjectives() {
  // Standard objectives
  objectives.forEach(obj => {
    if (obj.achieved) return;
    
    let isAchieved = false;
    switch(obj.type) {
      case "pademelons":
        isAchieved = pademelons >= obj.target;
        break;
      case "apex_stability":
        isAchieved = devils >= obj.target && grass > 400;
        break;
      case "keystone_effect":
        isAchieved = grass >= 150 * obj.target; // 150 is starting grass (100) × 1.5
        break;
      case "disasters":
        isAchieved = obj.count >= obj.target;
        break;
      case "biodiversity":
        isAchieved = biodiversityIndex > 0.7 && customFrameCount >= obj.target;
        break;
    }
    
    if (isAchieved) {
      obj.achieved = true;
      points += obj.points;
      showAchievement(obj.description, obj.points);
    }
  });
  
  // Ongoing objectives
  ongoingObjectives.forEach(obj => {
    if (obj.achieved) return;
    
    let conditionMet = false;
    switch(obj.type) {
      case "grass":
        conditionMet = obj.condition(grass);
        break;
      case "devils":
        conditionMet = obj.condition(devils);
        break;
      case "balanced":
        conditionMet = obj.condition(grass, pademelons, devils, bandicoots);
        break;
    }
    
    if (conditionMet) {
      obj.target--;
      if (obj.target <= 0) {
        obj.achieved = true;
        points += obj.points;
        showAchievement(obj.description, obj.points);
      }
    } else {
      // Reset progress if condition fails
      obj.target = obj.type === "balanced" ? 1500 : 800;
    }
  });
  
  // Achievements
  checkAchievements();
}

function updateEcosystemMetrics() {
  // Calculate biodiversity index (simplified)
  const total = grass + pademelons + devils + bandicoots;
  if (total > 0) {
    const p1 = grass / total;
    const p2 = pademelons / total;
    const p3 = devils / total;
    const p4 = bandicoots / total;
    biodiversityIndex = 1 - (p1*p1 + p2*p2 + p3*p3 + p4*p4);
  }
  
  // Update ecosystem health display
  updateHealthDisplay();
}

function updateHealthDisplay() {
  const healthElement = document.getElementById("ecosystemHealth");
  let healthStatus = "";
  let healthColor = "#4CAF50"; // Green
  
  if (grass === 0 || pademelons === 0 || devils === 0 || bandicoots === 0) {
    healthStatus = "COLLAPSED";
    healthColor = "#F44336"; // Red
  } else if (biodiversityIndex < 0.4) {
    healthStatus = "UNSTABLE";
    healthColor = "#FF9800"; // Orange
  } else {
    healthStatus = "HEALTHY";
  }
  
  healthElement.textContent = `Health: ${healthStatus}`;
  healthElement.style.color = healthColor;
}

function draw() {
  if (isPaused) return;
  
  // Background with seasonal colors
  background(showSeasons ? seasonParams[season].color : 240);
  
  // Draw ecosystem visualization
  drawEcosystem();
  
  // Update chart
  chart.update();
  
  // Update UI
  updateUI();
}

function drawEcosystem() {
  // Draw food web connections
  drawFoodWeb();
  
  // Draw population indicators
  drawPopulationIndicator(200, height/2, grass, "#4CAF50", "Grass");
  drawPopulationIndicator(400, height/2, pademelons, "#FF9800", "Pademelons");
  drawPopulationIndicator(600, height/2, devils, "#F44336", "Devils");
  drawPopulationIndicator(800, height/2, bandicoots, "#FFEB3B", "Bandicoots");
  
  // Draw biodiversity meter
  drawBiodiversityMeter();
}

function drawFoodWeb() {
  strokeWeight(2);
  
  // Grass → Pademelons
  if (grass > 10 && pademelons > 10) {
    stroke(0, 150, 0, 150);
    line(220, height/2, 380, height/2);
  }
  
  // Pademelons → Devils
  if (pademelons > 10 && devils > 10) {
    stroke(150, 0, 0, 150);
    line(420, height/2, 580, height/2);
  }
  
  // Bandicoots → Grass (positive feedback)
  if (bandicoots > 10 && grass > 10) {
    stroke(255, 255, 0, 150);
    drawingContext.setLineDash([5, 3]);
    line(780, height/2, 250, height/2);
    drawingContext.setLineDash([]);
  }
}

function drawPopulationIndicator(x, y, population, color, label) {
  const size = map(population, 0, 1000, 10, 100);
  fill(color);
  noStroke();
  
  // Draw multiple circles for animal populations
  const count = min(10, ceil(population / 50));
  for (let i = 0; i < count; i++) {
    const offsetX = random(-size/2, size/2);
    const offsetY = random(-size/3, size/3);
    ellipse(x + offsetX, y + offsetY, size);
  }
  
  // Label
  fill(0);
  textSize(12);
  textAlign(CENTER);
  text(`${label}: ${Math.round(population)}`, x, y + size/2 + 20);
}

function drawBiodiversityMeter() {
  const w = 150, h = 20;
  const x = width - w - 20, y = 20;
  
  // Background
  fill(240);
  rect(x, y, w, h);
  
  // Meter
  const meterWidth = w * biodiversityIndex;
  fill(lerpColor(color(255, 0, 0), color(0, 255, 0), biodiversityIndex));
  rect(x, y, meterWidth, h);
  
  // Text
  fill(0);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`Biodiversity: ${biodiversityIndex.toFixed(2)}`, x, y + h/2);
}

function updateUI() {
  // Update points display
  document.getElementById("pointsDisplay").textContent = points;
  
  // Update objective display
  updateObjectiveDisplay();
  
  // Check for ranger badge
  if (points >= rangerBadgePoints && !rangerBadgeAchieved) {
    rangerBadgeAchieved = true;
    document.getElementById("rangerBadge").style.display = "block";
    document.getElementById("medalIcon").style.display = "block";
    showAchievement("Congratulations! You've earned the Ranger Badge!", 0);
  }
}

function updateObjectiveDisplay() {
  const objectiveDisplay = document.getElementById("objectiveDisplay");
  const nextObj = objectives.find(obj => !obj.achieved) || 
                  ongoingObjectives.find(obj => !obj.achieved);
  
  if (nextObj) {
    objectiveDisplay.textContent = nextObj.description;
    
    // Add progress for ongoing objectives
    if (nextObj.target && nextObj.target !== nextObj.points) {
      const progress = ((nextObj.type === "balanced" ? 1500 : 800) - nextObj.target) / 
                      (nextObj.type === "balanced" ? 1500 : 800) * 100;
      objectiveDisplay.textContent += ` (${Math.round(progress)}% progress)`;
    }
  } else {
    objectiveDisplay.textContent = "All objectives completed! Try for achievements.";
  }
}

function showEventMessage(message, color) {
  const eventMsg = document.getElementById("disasterMessage");
  eventMsg.textContent = message;
  eventMsg.style.backgroundColor = color;
  eventMsg.style.display = "block";
  
  setTimeout(() => {
    eventMsg.style.opacity = "0";
    setTimeout(() => {
      eventMsg.style.display = "none";
      eventMsg.style.opacity = "1";
    }, 1000);
  }, 3000);
}

function showNarrativeMessage(message) {
  const narrativeElement = document.createElement("div");
  narrativeElement.className = "narrative-message";
  narrativeElement.textContent = message;
  document.body.appendChild(narrativeElement);
  
  setTimeout(() => {
    narrativeElement.style.opacity = "0";
    setTimeout(() => narrativeElement.remove(), 1000);
  }, 5000);
}

function showAchievement(message, points) {
  const achievementElement = document.createElement("div");
  achievementElement.className = "achievement-message";
  
  if (points > 0) {
    achievementElement.innerHTML = `<strong>${message}</strong><br>+${points} points`;
  } else {
    achievementElement.innerHTML = `<strong>${message}</strong>`;
  }
  
  document.getElementById("achievementsContainer").appendChild(achievementElement);
  
  setTimeout(() => {
    achievementElement.style.opacity = "0";
    setTimeout(() => achievementElement.remove(), 1000);
  }, 3000);
}

function checkAchievements() {
  achievements.forEach(achievement => {
    if (achievement.achieved) return;
    
    let achieved = false;
    
    if (achievement.description.includes("ongoing objectives")) {
      achieved = ongoingObjectives.every(obj => obj.achieved);
    } 
    else if (achievement.description.includes("devil population")) {
      achievement.frames = devils > 70 ? achievement.frames + 1 : 0;
      achieved = achievement.frames >= achievement.target;
    }
    else if (achievement.description.includes("bandicoot population")) {
      achieved = bandicoots >= achievement.target;
    }
    
    if (achieved) {
      achievement.achieved = true;
      points += achievement.points;
      showAchievement(achievement.description, achievement.points);
    }
  });
}

// UI control functions
function togglePause() {
  isPaused = !isPaused;
  document.getElementById("pauseButton").textContent = isPaused ? "Resume" : "Pause";
}

function toggleSeasonsDisplay() {
  showSeasons = document.getElementById("toggleSeasons").checked;
}

function toggleDisasters() {
  showDisasters = document.getElementById("toggleDisasters").checked;
}

function toggleGrassLimit() {
  grassLimitEnabled = !grassLimitEnabled;
  document.getElementById("toggleGrassLimitButton").textContent = 
    grassLimitEnabled ? "Disable Grass Limit" : "Enable Grass Limit";
}

function exportCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Time,Grass,Pademelons,Devils,Bandicoots\n";
  
  chart.data.labels.forEach((time, i) => {
    csvContent += `${time},${chart.data.datasets[0].data[i]},${chart.data.datasets[1].data[i]},${chart.data.datasets[2].data[i]},${chart.data.datasets[3].data[i]}\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "ecosystem_data.csv");
  link.textContent = "Download CSV";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function updateValue(id) {
  document.getElementById(id + 'Value').textContent = document.getElementById(id).value;
}

function showAnswer(id) {
  document.getElementById(id).style.display = 'block';
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', (event) => {
  // Initialize the simulation
  setup();
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    }
  });
});
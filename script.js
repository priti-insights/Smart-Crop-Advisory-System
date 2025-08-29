// script.js (replace the existing file with this)

let mobilenetModel = null;

// Load MobileNet once
async function loadModel() {
  try {
    document.getElementById("cropResult").innerText = "Loading model...";
    mobilenetModel = await mobilenet.load();
    document.getElementById("cropResult").innerText = ""; // clear
    console.log("MobileNet loaded");
  } catch (err) {
    console.error("Model load error", err);
    document.getElementById("cropResult").innerText = "Error loading model.";
  }
}
loadModel();

// ----------------- Utility: classify an uploaded image -----------------
async function classifyFile(file) {
  if (!file) throw new Error("No file provided");
  // create an image element and load the file into it
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  await img.decode(); // wait for image to be ready

  if (!mobilenetModel) {
    throw new Error("Model not loaded yet");
  }
  const predictions = await mobilenetModel.classify(img);
  // cleanup
  URL.revokeObjectURL(img.src);
  return predictions; // array of {className, probability}
}

// ----------------- Weather-based crop recommendation -----------------
async function recommendCrop() {
  // Priority: if user uploaded an image in weatherUpload, classify it for sky/clouds
  const weatherFile = document.getElementById("weatherUpload").files[0];
  const tempInput = document.getElementById("temperature").value;
  let result = "";

  if (weatherFile) {
    try {
      document.getElementById("cropResult").innerText = "Analyzing weather image...";
      const preds = await classifyFile(weatherFile);
      // simple heuristic mapping based on class names
      const labels = preds.map(p => p.className.toLowerCase()).join(", ");
      if (labels.includes("cloud") || labels.includes("nimbus") || labels.includes("storm")) {
        result = "Detected cloudy/stormy sky → delay sowing; prefer crops tolerant to excess moisture.";
      } else if (labels.includes("sun") || labels.includes("sky") || labels.includes("clear")) {
        result = "Detected clear sky → good conditions for sowing many crops (rice/maize depending on temp).";
      } else {
        result = "Image suggests mixed conditions: use temperature input for recommendation.";
      }
    } catch (err) {
      result = "Weather image analysis failed — please try again or use temperature input.";
      console.error(err);
    }
  } else {
    // fallback to temperature-only logic (existing)
    const temp = Number(tempInput);
    if (!tempInput || isNaN(temp)) {
      result = "Please enter temperature or upload a weather (sky) image.";
    } else {
      if (temp < 20) result = "Best crops: Wheat, Barley, Mustard 🌾";
      else if (temp >= 20 && temp <= 30) result = "Best crops: Rice, Maize, Cotton 🌽";
      else if (temp >= 30 && temp <= 45) result = "Best crops: Sugarcane, Millets, Sorghum 🌱";
      else result = "Chilli, Bitter Guard 🌾";
    }
  }

  document.getElementById("cropResult").innerText = result;
}

// ----------------- Soil Health Analysis -----------------
async function analyzeSoil() {
  const file = document.getElementById("soilUpload").files[0];
  const out = document.getElementById("soilResult");
  if (!file) {
    out.innerText = "Please upload a soil image first.";
    return;
  }

  try {
    out.innerText = "Analyzing soil image...";
    const preds = await classifyFile(file);
    // Use heuristics to convert generic ImageNet labels to soil health suggestions
    const labelString = preds.map(p => `${p.className} (${(p.probability*100).toFixed(1)}%)`).join(", ");

    // Heuristic mapping (example): if model thinks 'pottery', 'sand', 'clay' -> soil-like
    const joined = preds.map(p => p.className.toLowerCase()).join(" ");
    let advice = "";
    if (joined.includes("sand") || joined.includes("dune") || joined.includes("beach")) {
      advice = "Soil seems sandy → low water retention. Suggest: organic compost, mulching.";
    } else if (joined.includes("clay") || joined.includes("loam") || joined.includes("pottery")) {
      advice = "Soil seems clayey → may need drainage improvement and organic matter.";
    } else if (joined.includes("plant") || joined.includes("leaf") || joined.includes("moss")) {
      advice = "Image shows vegetation/plant matter. Check nutrients (NPK) via lab test.";
    } else {
      advice = "General check: consider Soil Health Card / lab test for NPK values.";
    }

    out.innerHTML = `<strong>Model predictions:</strong> ${labelString}<br><strong>Advice:</strong> ${advice}`;
  } catch (err) {
    console.error(err);
    out.innerText = "Soil analysis failed. Try a clearer image or try again.";
  }
}

// ----------------- Pest & Disease Detection -----------------
async function detectPest() {
  const file = document.getElementById("pestUpload").files[0];
  const out = document.getElementById("pestResult");
  if (!file) {
    out.innerText = "Please upload a pest/leaf image first.";
    return;
  }

  try {
    out.innerText = "Analyzing pest/disease image...";
    const preds = await classifyFile(file);
    const labelString = preds.map(p => `${p.className} (${(p.probability*100).toFixed(1)}%)`).join(", ");
    const joined = preds.map(p => p.className.toLowerCase()).join(" ");

    // Heuristic mapping to common agricultural issues
    let advice = "";
    if (joined.includes("leaf") || joined.includes("plant") || joined.includes("flower")) {
      // Check for fungus-like classes in MobileNet labels (limited)
      if (joined.includes("fungus") || joined.includes("mildew") || joined.includes("mold")) {
        advice = "Possible fungal infection detected. Suggest: organic fungicide, improve airflow.";
      } else if (joined.includes("insect") || joined.includes("bee") || joined.includes("fly") || joined.includes("caterpillar") || joined.includes("worm")) {
        advice = "Possible insect pest. Suggest: neem oil or biological control.";
      } else {
        // fallback: indicate plant-related issue
        advice = "Signs detected on leaf/plant — consider lab test or expert evaluation for precise diagnosis.";
      }
    } else {
      advice = "No clear pest/disease detected. If symptoms persist, take leaf close-up photos and consult an expert.";
    }

    out.innerHTML = `<strong>Model predictions:</strong> ${labelString}<br><strong>Advice:</strong> ${advice}`;
  } catch (err) {
    console.error(err);
    out.innerText = "Pest detection failed. Try a clearer close-up image of the affected area.";
  }
}

// ----------------- Existing other functions (market, schemes, finance, sms, ivr) -----------------
function predictPrice() {
  let crop = document.getElementById("cropSelect").value;
  let price = "";
  if (crop === "wheat") price = "₹2200/quintal (expected)";
  else if (crop === "rice") price = "₹2500/quintal (expected)";
  else price = "₹6000/quintal (expected)";
  document.getElementById("priceResult").innerText = price;
}

function showSchemes() {
  document.getElementById("schemeResult").innerHTML =
    "✅ PM-Kisan Samman Nidhi<br>✅ Crop Insurance Scheme<br>✅ Soil Health Card";
}

function showFinance() {
  document.getElementById("financeResult").innerHTML =
    "💰 Loan Options: NABARD, Kisan Credit Card<br>📑 Insurance: PM Fasal Bima Yojana";
}

function processSMS() {
  let query = document.getElementById("smsInput").value.toLowerCase();
  let reply = "Sorry, I didn't understand. Try again.";

  if (query.includes("recommend crop")) {
    if (query.includes("temp=25")) reply = "🌾 Best crop: Rice, Maize, Cotton";
    else if (query.includes("temp=15")) reply = "🌾 Best crop: Wheat, Mustard";
    else reply = "🌾 Enter like: recommend crop temp=20";
  }
  else if (query.includes("market price")) {
    if (query.includes("wheat")) reply = "💹 Wheat price: ₹2200/quintal";
    else if (query.includes("rice")) reply = "💹 Rice price: ₹2500/quintal";
    else reply = "💹 Try: market price rice";
  }
  else if (query.includes("scheme")) {
    reply = "✅ PM-Kisan, ✅ Soil Health Card, ✅ Crop Insurance";
  }

  document.getElementById("smsResult").innerText = reply;
}

function processIVR() {
  let option = document.getElementById("ivrSelect").value;
  let reply = "";

  if (option === "1") reply = "🌱 Crop Recommendation: Wheat & Barley (cold climate)";
  else if (option === "2") reply = "💹 Market Price: Rice ₹2500/quintal";
  else if (option === "3") reply = "🏛 Govt Schemes: PM-Kisan, Crop Insurance";
  else reply = "☎ Please select a valid option";

  document.getElementById("ivrResult").innerText = reply;
}

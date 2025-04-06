// Game state
let currentPokemon = null;
let isShiny = false;
let rerollCooldown = false;
let shinyDex = JSON.parse(localStorage.getItem('shinyDex')) || [];

// DOM elements
const pokemonDisplay = document.getElementById('pokemon-display');
const startHuntBtn = document.getElementById('start-hunt');
const rerollBtn = document.getElementById('reroll');
const ballSelector = document.getElementById('ball-selector');
const shinyEntries = document.getElementById('shiny-entries');

// Load data files
async function loadData() {
    const pokemonRes = await fetch('data/pokemon.txt');
    const pokemonText = await pokemonRes.text();
    const pokemonList = pokemonText.split('\n').map(line => {
        const [name, isLegendary, baseCatchRate] = line.split(',');
        return {
            name: name.trim(),
            isLegendary: isLegendary === '1',
            baseCatchRate: parseInt(baseCatchRate)
        };
    }).filter(p => p.name);

    const ballsRes = await fetch('data/pokeballs.txt');
    const ballsText = await ballsRes.text();
    const ballsList = ballsText.split('\n').map(line => {
        const [name, multiplier] = line.split(',');
        return {
            name: name.trim(),
            multiplier: parseFloat(multiplier)
        };
    }).filter(b => b.name);

    return { pokemonList, ballsList };
}

// Initialize game
async function init() {
    const { pokemonList, ballsList } = await loadData();
    
    // Create ball buttons
    ballsList.forEach(ball => {
        const btn = document.createElement('button');
        btn.className = 'ball-btn';
        btn.textContent = ball.name;
        btn.onclick = () => attemptCatch(ball);
        ballSelector.appendChild(btn);
    });
    
    // Set up event listeners
    startHuntBtn.addEventListener('click', () => startRandomHunt(pokemonList));
    rerollBtn.addEventListener('click', reroll);
    
    renderShinyDex();
}

// Start a random hunt
function startRandomHunt(pokemonList) {
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    currentPokemon = pokemonList[randomIndex];
    rollForShiny();
}

// Roll for shiny (1 in 4096 chance)
function rollForShiny() {
    isShiny = Math.floor(Math.random() * 4096) === 0;
    displayPokemon();
    
    if (isShiny) {
        rerollCooldown = true;
        rerollBtn.disabled = true;
        setTimeout(() => {
            rerollCooldown = false;
            rerollBtn.disabled = false;
        }, 5000); // 5-second cooldown for shinies
    }
}

// Display current Pokémon
function displayPokemon() {
    let displayText = currentPokemon.name;
    if (isShiny) {
        displayText += " ★";
        pokemonDisplay.className = 'shiny';
    } else {
        pokemonDisplay.className = '';
    }
    pokemonDisplay.textContent = displayText;
}

// Attempt to catch the Pokémon
function attemptCatch(ball) {
    if (!currentPokemon) return;
    
    // Master Ball always catches
    if (ball.multiplier === 255) {
        addToShinyDex(ball.name);
        return;
    }
    
    // Calculate catch chance
    const catchRate = (currentPokemon.baseCatchRate * ball.multiplier) / 255;
    const success = Math.random() < catchRate;
    
    if (success && isShiny) {
        addToShinyDex(ball.name);
    } else {
        alert(success ? "Caught! (But it wasn't shiny)" : "Oh no! It broke free!");
    }
}

// Add to Shiny Dex
function addToShinyDex(ballName) {
    if (!isShiny) return;
    
    const entry = {
        pokemon: currentPokemon.name,
        ball: ballName,
        date: new Date().toLocaleDateString()
    };
    
    shinyDex.push(entry);
    localStorage.setItem('shinyDex', JSON.stringify(shinyDex));
    renderShinyDex();
    alert(`Shiny ${currentPokemon.name} caught in ${ballName}!`);
}

// Render Shiny Dex
function renderShinyDex() {
    shinyEntries.innerHTML = shinyDex.map(entry => 
        `<div class="shiny-entry">
            ${entry.pokemon} ★<br>
            <small>${entry.ball}</small>
        </div>`
    ).join('');
}

// Reroll current Pokémon
function reroll() {
    if (rerollCooldown) return;
    if (!currentPokemon) return;
    rollForShiny();
}

// Start the game
init();

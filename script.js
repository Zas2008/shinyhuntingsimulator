const pokemonDisplay = document.getElementById('pokemon-display');
const startHuntBtn = document.getElementById('start-hunt');
const rerollBtn = document.getElementById('reroll');
const ballSelector = document.getElementById('ball-selector');
const shinyEntries = document.getElementById('shiny-entries');

let currentPokemon = null;
let isShiny = false;
let rerollCooldown = false;
let shinyDex = JSON.parse(localStorage.getItem('shinyDex')) || [];

async function loadPokemonData() {
    const response = await fetch('data/pokemon.txt');
    const textData = await response.text();
    return textData.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
            const [name, isLegendary, baseCatchRate] = line.split(',');
            return {
                name: name.trim(),
                isLegendary: isLegendary === '1',
                baseCatchRate: parseInt(baseCatchRate.trim())
            };
        });
}

async function loadPokeballData() {
    const response = await fetch('data/pokeballs.txt');
    const textData = await response.text();
    return textData.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
            const [name, multiplier] = line.split(',');
            return {
                name: name.trim(),
                multiplier: parseFloat(multiplier.trim())
            };
        });
}

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

function rollForShiny() {
    isShiny = Math.floor(Math.random() * 4096) === 0;
    displayPokemon();
    
    if (isShiny) {
        rerollCooldown = true;
        rerollBtn.disabled = true;
        setTimeout(() => {
            rerollCooldown = false;
            rerollBtn.disabled = false;
        }, 5000);
    }
}

function startRandomHunt(pokemonList) {
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    currentPokemon = pokemonList[randomIndex];
    rollForShiny();
}

function attemptCatch(ball) {
    if (!currentPokemon) return;
    
    if (ball.multiplier === 255) {
        addToShinyDex(ball.name);
        return;
    }
    
    const catchRate = (currentPokemon.baseCatchRate * ball.multiplier) / 255;
    const success = Math.random() < catchRate;
    
    if (success && isShiny) {
        addToShinyDex(ball.name);
    } else {
        alert(success ? "Caught! (But it wasn't shiny)" : "Oh no! It broke free!");
    }
}

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

function renderShinyDex() {
    shinyEntries.innerHTML = shinyDex.map(entry => 
        `<div class="shiny-entry">
            ${entry.pokemon} ★<br>
            <small>${entry.ball}</small>
        </div>`
    ).join('');
}

function reroll() {
    if (rerollCooldown) return;
    if (!currentPokemon) return;
    rollForShiny();
}

async function init() {
    const pokemonList = await loadPokemonData();
    const ballsList = await loadPokeballData();
    
    ballsList.forEach(ball => {
        const btn = document.createElement('button');
        btn.className = 'ball-btn';
        btn.textContent = ball.name;
        btn.addEventListener('click', () => attemptCatch(ball));
        ballSelector.appendChild(btn);
    });
    
    startHuntBtn.addEventListener('click', () => startRandomHunt(pokemonList));
    rerollBtn.addEventListener('click', reroll);
    
    renderShinyDex();
}

window.addEventListener('DOMContentLoaded', init);

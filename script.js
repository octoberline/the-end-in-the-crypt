// Game configuration
const CONFIG = {
    MAX_DAYS: 18,
    LOCATIONS: ["Forest", "Ruins", "Catacombs", "Necropolis", "Chthonic Temple", "Crypt"],
    HEROES: {
        necromancer: { name: "Necromancer", hp: 16, dp: 2, rp: 2, ap: 0, mp: 5, sp: 2, type: "mage" },
        witch: { name: "Witch", hp: 24, dp: 1, rp: 4, ap: 0, mp: 3, sp: 2, type: "mage" },
        pyromancer: { name: "Pyromancer", hp: 40, dp: 3, rp: 4, ap: 0, mp: 4, sp: 1, type: "mage" },
        adept: { name: "Adept", hp: 24, dp: 2, rp: 2, ap: 2, mp: 2, sp: 2, type: "mage" },
        rogue: { name: "Rogue", hp: 16, dp: 1, rp: 1, ap: 2, mp: 0, sp: 3, type: "warrior" },
        fugitive: { name: "Fugitive", hp: 24, dp: 2, rp: 2, ap: 4, mp: 0, sp: 2, type: "warrior" },
        ranger: { name: "Ranger", hp: 24, dp: 1, rp: 1, ap: 6, mp: 0, sp: 2, type: "warrior" },
        acolyte: { name: "Acolyte", hp: 32, dp: 1, rp: 5, ap: 4, mp: 2, sp: 1, type: "warrior" }
    },
    MONSTER_TYPES: [
        ["Wolf", "Bear", "Bandit", "Marauder"], // Forest
        ["Sectant", "Ghoul", "Wraith", "Mutant"], // Ruins
        ["Ghost", "Mutant", "Shade", "Banshee"], // Catacombs
        ["Skeleton", "Zombie", "Lich", "Wight"], // Necropolis
        ["Demon", "Imp", "Golem", "Hellhound"], // Chthonic Temple
        ["Demon Lord", "Archfiend", "Abyssal Dragon", "Nightmare"] // Crypt
    ]
};

// DOM elements
const DOM = {
    dayCounter: document.getElementById("day-counter"),
    currentLocation: document.getElementById("current-location"),
    currentPhase: document.getElementById("current-phase"),
    player1Gold: document.getElementById("player1-gold"),
    player2Gold: document.getElementById("player2-gold"),
    player1Hero: document.getElementById("player1-hero"),
    player2Hero: document.getElementById("player2-hero"),
    monstersArea: document.getElementById("monster-cards"),
    equipmentShop: document.getElementById("equipment-shop"),
    unitShop: document.getElementById("unit-shop"),
    startGameBtn: document.getElementById("start-game"),
    resetGameBtn: document.getElementById("reset-game"),
    endTurnPlayer1: document.getElementById("end-turn-player1"),
    endTurnPlayer2: document.getElementById("end-turn-player2"),
    heroSelectionModal: document.getElementById("hero-selection-modal"),
    attackModal: document.getElementById("attack-modal"),
    gameOverModal: document.getElementById("game-over-modal"),
    gameResult: document.getElementById("game-result"),
    gameResultDetails: document.getElementById("game-result-details"),
    newGameBtn: document.getElementById("new-game"),
    physicalAttackBtn: document.getElementById("physical-attack"),
    magicalAttackBtn: document.getElementById("magical-attack"),
    cancelAttackBtn: document.getElementById("cancel-attack"),
    passShopBtn: document.getElementById("pass-shop")
};

// Game state
const gameState = {
    currentPlayer: null,
    day: 1,
    turnCount: 0,
    currentLocation: 0,
    phase: "setup",
    activePhase: "setup",
    players: {
        player1: {
            hero: null,
            gold: 0,
            weapon: null,
            armor: null,
            units: [],
            selected: false
        },
        player2: {
            hero: null,
            gold: 0,
            weapon: null,
            armor: null,
            units: [],
            selected: false
        }
    },
    monsters: [],
    shop: {
        equipment: null,
        unit: null
    },
    actionsRemaining: 0,
    attackType: null,
    selectedCard: null
};

// Utility function to render cards
function renderCard(type, data, element, index = null) {
    if (!data) return;

    if (type === "hero") {
        element.innerHTML = `
            <div class="hero-name">${data.name}</div>
            <div class="hero-stats">
                <div>HP: <span class="hero-hp">${data.currentHp}/${data.maxHp}</span></div>
                <div>AP: <span class="hero-ap">${data.ap}</span></div>
                <div>MP: <span class="hero-mp">${data.mp}</span></div>
                <div>DP: <span class="hero-dp">${data.dp}</span></div>
                <div>RP: <span class="hero-rp">${data.rp}</span></div>
                <div>SP: <span class="hero-sp">${data.sp}</span></div>
            </div>
        `;
    } else if (type === "unit") {
        element.innerHTML = `
            <div>${data.name}</div>
            <div>HP: ${data.hp}/${data.maxHp}</div>
            <div>AP: ${data.ap}</div>
            <div>MP: ${data.mp}</div>
        `;
        if (index !== null) {
            element.dataset.index = index;
            if (gameState.phase === "units" && element.closest(`#${gameState.currentPlayer}-units`)) {
                element.classList.add("selectable");
                element.addEventListener("click", () => selectUnit(index));
            }
        }
    } else if (type === "monster") {
        element.innerHTML = `
            <div>${data.name}</div>
            <div>HP: ${data.hp}/${data.maxHp}</div>
            <div>AP: ${data.ap}</div>
            <div>MP: ${data.mp}</div>
            <div>Reward: ${data.goldReward} gold</div>
        `;
        if (index !== null) {
            element.dataset.index = index;
            element.addEventListener("click", () => attackMonster(index));
        }
    }
}

// Initialize game
function initGame() {
    resetGame();
    DOM.startGameBtn.addEventListener("click", startGame);
    DOM.resetGameBtn.addEventListener("click", resetGame);
    DOM.endTurnPlayer1.addEventListener("click", endTurn);
    DOM.endTurnPlayer2.addEventListener("click", endTurn);
    DOM.newGameBtn.addEventListener("click", () => {
        DOM.gameOverModal.style.display = "none";
        resetGame();
    });
    DOM.physicalAttackBtn.addEventListener("click", () => performAttack("physical"));
    DOM.magicalAttackBtn.addEventListener("click", () => performAttack("magical"));
    DOM.cancelAttackBtn.addEventListener("click", () => {
        DOM.attackModal.style.display = "none";
        gameState.selectedCard = null;
    });
    DOM.passShopBtn.addEventListener("click", () => {
        if (gameState.phase === "shop") {
            gameState.phase = "hero";
            gameState.activePhase = "hero";
            gameState.actionsRemaining = gameState.players[gameState.currentPlayer].hero.sp;
            updatePhaseDisplay();
            updateUI();
        }
    });

    // Delegated event listener for attacks
    document.querySelector(".game-container").addEventListener("click", (e) => {
        const target = e.target.closest(".attackable");
        if (!target || gameState.phase !== "units" || !gameState.selectedCard) return;

        if (target.matches(".monster-card")) {
            const index = parseInt(target.dataset.index);
            attackMonster(index);
        } else if (target.matches(`#player1-hero, #player2-hero`)) {
            attackEnemyHero();
        } else if (target.matches(".unit-slot")) {
            const index = parseInt(target.dataset.index);
            if (!isNaN(index)) {
                attackEnemyUnit(index);
            }
        }
    });

    setupHeroSelection();
    setupShopListeners();
}

function setupHeroSelection() {
    const heroOptions = document.querySelectorAll(".hero-option");
    heroOptions.forEach(option => {
        option.addEventListener("click", () => {
            const heroKey = option.dataset.hero;
            if (gameState.players.player1.selected === false) {
                selectHero("player1", heroKey);
                gameState.players.player1.selected = true;
                
                if (gameState.players.player2.selected) {
                    DOM.heroSelectionModal.style.display = "none";
                }
            } else if (gameState.players.player2.selected === false) {
                selectHero("player2", heroKey);
                gameState.players.player2.selected = true;
                DOM.heroSelectionModal.style.display = "none";
            }
        });
    });
}

function setupShopListeners() {
    DOM.equipmentShop.addEventListener("click", () => {
        if (gameState.phase === "shop" && gameState.shop.equipment) {
            buyEquipment();
        }
    });
    
    DOM.unitShop.addEventListener("click", () => {
        if (gameState.phase === "shop" && gameState.shop.unit) {
            buyUnit();
        }
    });
}

function selectHero(player, heroKey) {
    const heroData = CONFIG.HEROES[heroKey];
    gameState.players[player].hero = {
        ...heroData,
        maxHp: heroData.hp,
        currentHp: heroData.hp
    };
    
    updateHeroDisplay(player);
}

function updateHeroDisplay(player) {
    const heroElement = player === "player1" ? DOM.player1Hero : DOM.player2Hero;
    const hero = gameState.players[player].hero;
    if (hero) {
        renderCard("hero", hero, heroElement);
    }
}

function startGame() {
    if (!gameState.players.player1.hero || !gameState.players.player2.hero) {
        DOM.heroSelectionModal.style.display = "flex";
        return;
    }
    
    gameState.currentPlayer = Math.random() < 0.5 ? "player1" : "player2";
    updateLocation();
    generateMonsters();
    generateShopItems();
    
    gameState.phase = "shop";
    gameState.activePhase = "shop";
    updatePhaseDisplay();
    updateUI();
}

function resetGame() {
    gameState.currentPlayer = null;
    gameState.day = 1;
    gameState.turnCount = 0;
    gameState.currentLocation = 0;
    gameState.phase = "setup";
    gameState.activePhase = "setup";
    
    gameState.players.player1 = {
        hero: null,
        gold: 0,
        weapon: null,
        armor: null,
        units: [],
        selected: false
    };
    
    gameState.players.player2 = {
        hero: null,
        gold: 0,
        weapon: null,
        armor: null,
        units: [],
        selected: false
    };
    
    gameState.monsters = [];
    gameState.shop = {
        equipment: null,
        unit: null
    };
    
    gameState.actionsRemaining = 0;
    
    updateUI();
    DOM.dayCounter.textContent = "1";
    DOM.currentLocation.textContent = "Forest";
    DOM.currentPhase.textContent = "Setup";
    DOM.player1Gold.textContent = "0";
    DOM.player2Gold.textContent = "0";
    DOM.player1Hero.innerHTML = `<div class="hero-name">Select Hero</div><div class="hero-stats"></div>`;
    DOM.player2Hero.innerHTML = `<div class="hero-name">Select Hero</div><div class="hero-stats"></div>`;
    DOM.monstersArea.innerHTML = "";
    DOM.equipmentShop.textContent = "Equipment Card";
    DOM.unitShop.textContent = "Unit Card";
    
    DOM.startGameBtn.disabled = false;
}

function updateLocation() {
    const locationIndex = Math.min(Math.floor((gameState.day - 1) / 3), CONFIG.LOCATIONS.length - 1);
    gameState.currentLocation = locationIndex;
    DOM.currentLocation.textContent = CONFIG.LOCATIONS[locationIndex];
}

function getMonsterName(locationLevel) {
    const monsterPool = CONFIG.MONSTER_TYPES[locationLevel];
    return monsterPool[Math.floor(Math.random() * monsterPool.length)];
}

function generateMonsters() {
    gameState.monsters = [];
    DOM.monstersArea.innerHTML = "";

    const hpRanges = [
        { min: 1, max: 3 }, // Forest
        { min: 2, max: 5 }, // Ruins
        { min: 3, max: 7 }, // Catacombs
        { min: 4, max: 9 }, // Necropolis
        { min: 5, max: 11 }, // Chthonic Temple
        { min: 6, max: 13 } // Crypt
    ];

    const locationLevel = gameState.currentLocation;
    const numMonsters = Math.floor(Math.random() * 2) + 3;
    const hpRange = hpRanges[locationLevel];

    for (let i = 0; i < numMonsters; i++) {
        const hp = Math.min(13, Math.floor(Math.random() * (hpRange.max - hpRange.min + 1)) + hpRange.min);
        const ap = Math.min(10, Math.floor(Math.random() * (locationLevel + 2)));
        const mp = Math.min(10, Math.floor(Math.random() * (locationLevel + 2)));
        const goldReward = Math.min(10, Math.floor(Math.random() * (locationLevel + 1)) + locationLevel + 1);

        const monster = {
            name: getMonsterName(locationLevel),
            hp: hp,
            maxHp: hp,
            ap: ap,
            mp: mp,
            goldReward: goldReward
        };

        gameState.monsters.push(monster);

        const monsterCard = document.createElement("div");
        monsterCard.className = "monster-card";
        renderCard("monster", monster, monsterCard, i);
        DOM.monstersArea.appendChild(monsterCard);
    }
}

function generateShopItems() {
    const equipmentTypes = ["weapon", "armor"];
    const equipmentType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    const locationLevel = gameState.currentLocation + 1;
    const statBoost = Math.floor(Math.random() * locationLevel) + 1;
    
    let equipment;
    if (equipmentType === "weapon") {
        const isPhysical = Math.random() > 0.5;
        equipment = {
            name: isPhysical ? `${getWeaponPrefix()} Sword` : `${getWeaponPrefix()} Staff`,
            type: "weapon",
            ap: isPhysical ? statBoost : 0,
            mp: isPhysical ? 0 : statBoost,
            cost: statBoost * 2
        };
    } else {
        const isPhysical = Math.random() > 0.5;
        equipment = {
            name: isPhysical ? `${getArmorPrefix()} Shield` : `${getArmorPrefix()} Robe`,
            type: "armor",
            dp: isPhysical ? statBoost : 0,
            rp: isPhysical ? 0 : statBoost,
            cost: statBoost * 2
        };
    }
    
    gameState.shop.equipment = equipment;
    
    const hp = Math.max(1, Math.floor(Math.random() * (locationLevel * 2)) + locationLevel);
    const ap = Math.random() > 0.5 ? Math.floor(Math.random() * locationLevel) + 1 : 0;
    const mp = ap === 0 ? Math.floor(Math.random() * locationLevel) + 1 : Math.floor(Math.random() * locationLevel);
    
    const unitTypes = [
        "Mercenary", "Hunter", "Mage", "Soldier", "Archer", 
        "Knight", "Wizard", "Rogue", "Assassin", "Paladin"
    ];
    
    const unit = {
        name: unitTypes[Math.floor(Math.random() * unitTypes.length)],
        hp: hp,
        maxHp: hp,
        ap: ap,
        mp: mp,
        cost: Math.max(2, Math.floor((hp + ap + mp) / 2))
    };
    
    gameState.shop.unit = unit;
    
    updateShopDisplay();
}

function getWeaponPrefix() {
    const prefixes = ["Iron", "Steel", "Bronze", "Silver", "Gold", "Diamond", "Crystal", "Obsidian", "Enchanted", "Cursed"];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
}

function getArmorPrefix() {
    const prefixes = ["Leather", "Chain", "Plate", "Dragon", "Demon", "Angel", "Mithril", "Elven", "Dwarven", "Shadow"];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
}

function updateShopDisplay() {
    if (gameState.shop.equipment) {
        const equipment = gameState.shop.equipment;
        let statsDisplay = "";
        
        if (equipment.ap > 0) statsDisplay += `AP: +${equipment.ap} `;
        if (equipment.mp > 0) statsDisplay += `MP: +${equipment.mp} `;
        if (equipment.dp > 0) statsDisplay += `DP: +${equipment.dp} `;
        if (equipment.rp > 0) statsDisplay += `RP: +${equipment.rp} `;
        
        DOM.equipmentShop.innerHTML = `
            <div>${equipment.name}</div>
            <div>${statsDisplay}</div>
            <div>Cost: ${equipment.cost} gold</div>
        `;
    } else {
        DOM.equipmentShop.textContent = "No equipment available";
    }
    
    if (gameState.shop.unit) {
        const unit = gameState.shop.unit;
        DOM.unitShop.innerHTML = `
            <div>${unit.name}</div>
            <div>HP: ${unit.hp}</div>
            <div>AP: ${unit.ap} MP: ${unit.mp}</div>
            <div>Cost: ${unit.cost} gold</div>
        `;
    } else {
        DOM.unitShop.textContent = "No unit available";
    }
}

function buyEquipment() {
    const currentPlayerObj = gameState.players[gameState.currentPlayer];
    const equipment = gameState.shop.equipment;
    
    if (currentPlayerObj.gold >= equipment.cost) {
        currentPlayerObj.gold -= equipment.cost;
        
        if (equipment.type === "weapon") {
            currentPlayerObj.weapon = equipment;
        } else {
            currentPlayerObj.armor = equipment;
        }
        
        applyEquipmentStats(gameState.currentPlayer);
        updateUI();
        
        gameState.phase = "hero";
        gameState.activePhase = "hero";
        gameState.actionsRemaining = currentPlayerObj.hero.sp;
        updatePhaseDisplay();
        
        gameState.shop.equipment = null;
        updateShopDisplay();
    } else {
        alert("Not enough gold!");
    }
}

function buyUnit() {
    const currentPlayerObj = gameState.players[gameState.currentPlayer];
    const unit = gameState.shop.unit;
    
    if (currentPlayerObj.gold >= unit.cost) {
        if (currentPlayerObj.units.length >= 3) {
            alert("You already have the maximum number of units (3)!");
            return;
        }
        
        currentPlayerObj.gold -= unit.cost;
        currentPlayerObj.units.push(unit);
        
        updateUnitsDisplay(gameState.currentPlayer);
        updateGoldDisplay();
        
        gameState.phase = "hero";
        gameState.activePhase = "hero";
        gameState.actionsRemaining = currentPlayerObj.hero.sp;
        updatePhaseDisplay();
        
        gameState.shop.unit = null;
        updateShopDisplay();
    } else {
        alert("Not enough gold!");
    }
}

function applyEquipmentStats(player) {
    const playerObj = gameState.players[player];
    const hero = playerObj.hero;
    const baseHero = CONFIG.HEROES[hero.name.toLowerCase()];
    
    hero.ap = baseHero.ap;
    hero.mp = baseHero.mp;
    hero.dp = baseHero.dp;
    hero.rp = baseHero.rp;
    
    if (playerObj.weapon) {
        hero.ap += playerObj.weapon.ap || 0;
        hero.mp += playerObj.weapon.mp || 0;
    }
    
    if (playerObj.armor) {
        hero.dp += playerObj.armor.dp || 0;
        hero.rp += playerObj.armor.rp || 0;
    }
    
    updateHeroDisplay(player);
}

function updateUnitsDisplay(player) {
    const unitsArea = document.getElementById(`${player}-units`);
    unitsArea.innerHTML = "";
    
    const playerObj = gameState.players[player];
    
    for (let i = 0; i < 3; i++) {
        const unitSlot = document.createElement("div");
        unitSlot.className = "unit-slot";
        
        if (i < playerObj.units.length) {
            renderCard("unit", playerObj.units[i], unitSlot, i);
        } else {
            unitSlot.textContent = `Unit ${i + 1}`;
        }
        
        unitsArea.appendChild(unitSlot);
    }
}

function selectUnit(index) {
    if (gameState.phase !== "units" || gameState.players[gameState.currentPlayer].units.length <= index) {
        return;
    }
    
    gameState.selectedCard = {
        type: "unit",
        index: index
    };
    
    highlightTargets();
}

function highlightTargets() {
    clearHighlights();
    
    const enemyPlayer = gameState.currentPlayer === "player1" ? "player2" : "player1";
    document.getElementById(`${enemyPlayer}-hero`).classList.add("attackable");
    document.querySelectorAll(`#${enemyPlayer}-units .unit-slot:not(:empty)`).forEach(slot => {
        slot.classList.add("attackable");
    });
    document.querySelectorAll(".monster-card").forEach(card => {
        card.classList.add("attackable");
    });
}

function clearHighlights() {
    document.querySelectorAll(".attackable, .selectable").forEach(el => {
        el.classList.remove("attackable", "selectable");
    });
}

function attackMonster(monsterIndex) {
    if (gameState.phase !== "hero" && gameState.phase !== "units") return;
    const monster = gameState.monsters[monsterIndex];
    if (!monster || monster.hp <= 0) return;

    if (gameState.phase === "hero") {
        const hero = gameState.players[gameState.currentPlayer].hero;
        if (hero.ap > 0 && hero.mp > 0) {
            gameState.selectedCard = {
                type: "hero",
                target: { type: "monster", index: monsterIndex }
            };
            DOM.physicalAttackBtn.disabled = hero.ap <= 0;
            DOM.magicalAttackBtn.disabled = hero.mp <= 0;
            DOM.attackModal.style.display = "flex";
        } else {
            const attackType = hero.ap > 0 ? "physical" : "magical";
            performHeroAttack(attackType, "monster", monsterIndex);
        }
    } else if (gameState.selectedCard && gameState.selectedCard.type === "unit") {
        const unitIndex = gameState.selectedCard.index;
        const unit = gameState.players[gameState.currentPlayer].units[unitIndex];
        if (!unit || unit.hp <= 0) return;

        const attackType = unit.ap > 0 ? "physical" : "magical";
        const damage = attackType === "physical" ? unit.ap : unit.mp;
        
        monster.hp -= damage;
        const monsterDamage = monster.ap > 0 ? monster.ap : monster.mp;
        unit.hp -= monsterDamage;
        
        if (monster.hp <= 0) {
            gameState.players[gameState.currentPlayer].gold += monster.goldReward;
            gameState.monsters.splice(monsterIndex, 1);
            updateGoldDisplay();
            generateMonsters();
        } else {
            updateMonsterDisplay(monsterIndex);
        }
        
        if (unit.hp <= 0) {
            gameState.players[gameState.currentPlayer].units.splice(unitIndex, 1);
        }
        
        updateUnitsDisplay(gameState.currentPlayer);
        clearHighlights();
        gameState.selectedCard = null;
    }
}

function performHeroAttack(attackType, targetType, targetIndex) {
    const hero = gameState.players[gameState.currentPlayer].hero;
    
    gameState.actionsRemaining--;
    
    if (targetType === "monster") {
        const monster = gameState.monsters[targetIndex];
        if (!monster) return;
        
        const damage = attackType === "physical" ? hero.ap : hero.mp;
        monster.hp -= damage;
        
        const monsterDamage = monster.ap > 0 ? monster.ap : monster.mp;
        const heroDefense = attackType === "physical" ? hero.dp : hero.rp;
        const finalDamage = Math.max(0, monsterDamage - heroDefense);
        
        hero.currentHp -= finalDamage;
        
        if (hero.currentHp <= 0) {
            gameOver(gameState.currentPlayer === "player1" ? "player2" : "player1");
            return;
        }
        
        if (monster.hp <= 0) {
            gameState.players[gameState.currentPlayer].gold += monster.goldReward;
            gameState.monsters.splice(targetIndex, 1);
            updateGoldDisplay();
            generateMonsters();
        } else {
            updateMonsterDisplay(targetIndex);
        }
        
        updateHeroDisplay(gameState.currentPlayer);
    } else if (targetType === "enemyHero") {
        const enemyPlayer = gameState.currentPlayer === "player1" ? "player2" : "player1";
        const enemyHero = gameState.players[enemyPlayer].hero;
        
        const damage = attackType === "physical" ? hero.ap : hero.mp;
        const enemyDefense = attackType === "physical" ? enemyHero.dp : enemyHero.rp;
        const finalDamage = Math.max(0, damage - enemyDefense);
        
        enemyHero.currentHp -= finalDamage;
        
        if (enemyHero.currentHp <= 0) {
            gameOver(gameState.currentPlayer);
            return;
        }
        
        updateHeroDisplay(enemyPlayer);
    }
    
    if (gameState.actionsRemaining <= 0) {
        gameState.phase = "units";
        gameState.activePhase = "units";
        updatePhaseDisplay();
        updateUnitsDisplay(gameState.currentPlayer);
    }
}

function performAttack(attackType) {
    DOM.attackModal.style.display = "none";
    
    if (gameState.selectedCard && gameState.selectedCard.type === "hero") {
        const target = gameState.selectedCard.target;
        performHeroAttack(attackType, target.type, target.index);
    }
    
    gameState.selectedCard = null;
}

function attackEnemyHero() {
    if (!gameState.selectedCard || gameState.phase !== "units") return;
    
    const unitIndex = gameState.selectedCard.index;
    const unit = gameState.players[gameState.currentPlayer].units[unitIndex];
    
    const enemyPlayer = gameState.currentPlayer === "player1" ? "player2" : "player1";
    const enemyHero = gameState.players[enemyPlayer].hero;
    
    const attackType = unit.ap > 0 ? "physical" : "magical";
    const damage = attackType === "physical" ? unit.ap : unit.mp;
    const enemyDefense = attackType === "physical" ? enemyHero.dp : enemyHero.rp;
    const finalDamage = Math.max(0, damage - enemyDefense);
    
    enemyHero.currentHp -= finalDamage;
    
    if (enemyHero.currentHp <= 0) {
        gameOver(gameState.currentPlayer);
        return;
    }
    
    updateHeroDisplay(enemyPlayer);
    clearHighlights();
    gameState.selectedCard = null;
}

function attackEnemyUnit(unitIndex) {
    if (!gameState.selectedCard || gameState.phase !== "units") return;
    
    const attackerIndex = gameState.selectedCard.index;
    const attacker = gameState.players[gameState.currentPlayer].units[attackerIndex];
    
    const enemyPlayer = gameState.currentPlayer === "player1" ? "player2" : "player1";
    const defender = gameState.players[enemyPlayer].units[unitIndex];
    
    if (!defender) return;
    
    const attackType = attacker.ap > 0 ? "physical" : "magical";
    const damage = attackType === "physical" ? attacker.ap : attacker.mp;
    
    defender.hp -= damage;
    
    const defenderDamage = defender.ap > 0 ? defender.ap : defender.mp;
    attacker.hp -= defenderDamage;
    
    if (defender.hp <= 0) {
        gameState.players[enemyPlayer].units.splice(unitIndex, 1);
    }
    if (attacker.hp <= 0) {
        gameState.players[gameState.currentPlayer].units.splice(attackerIndex, 1);
    }
    
    updateUnitsDisplay(gameState.currentPlayer);
    updateUnitsDisplay(enemyPlayer);
    
    clearHighlights();
    gameState.selectedCard = null;
}

function updateMonsterDisplay(index) {
    const monsterCards = document.querySelectorAll(".monster-card");
    if (index < monsterCards.length) {
        renderCard("monster", gameState.monsters[index], monsterCards[index], index);
    }
}

function updateGoldDisplay() {
    DOM.player1Gold.textContent = gameState.players.player1.gold;
    DOM.player2Gold.textContent = gameState.players.player2.gold;
}

function updatePhaseDisplay() {
    let phaseText = "";
    
    switch (gameState.phase) {
        case "setup":
            phaseText = "Setup";
            break;
        case "shop":
            phaseText = "Shop Phase";
            break;
        case "hero":
            phaseText = "Hero Phase";
            break;
        case "units":
            phaseText = "Units Phase";
            break;
        case "gameOver":
            phaseText = "Game Over";
            break;
    }
    
    DOM.currentPhase.textContent = phaseText;
}

function endTurn() {
    if (gameState.phase === "gameOver") return;
    
    gameState.turnCount++;
    gameState.currentPlayer = gameState.currentPlayer === "player1" ? "player2" : "player1";
    
    if (gameState.turnCount % 2 === 0) {
        gameState.day++;
        DOM.dayCounter.textContent = gameState.day;
        
        if (gameState.day % 3 === 1 && gameState.day <= 18) {
            updateLocation();
            generateMonsters();
        }
        
        if (gameState.day > 18) {
            gameOver(null);
            return;
        }
    }
    
    gameState.phase = "shop";
    gameState.activePhase = "shop";
    generateShopItems();
    updatePhaseDisplay();
    updateUI();
}

function updateUI() {
    document.getElementById("player1-area").classList.toggle("active-player", gameState.currentPlayer === "player1");
    document.getElementById("player2-area").classList.toggle("active-player", gameState.currentPlayer === "player2");
    
    updateGoldDisplay();
    
    if (gameState.players.player1.hero) updateHeroDisplay("player1");
    if (gameState.players.player2.hero) updateHeroDisplay("player2");
    
    updateUnitsDisplay("player1");
    updateUnitsDisplay("player2");
    
    DOM.endTurnPlayer1.disabled = gameState.currentPlayer !== "player1";
    DOM.endTurnPlayer2.disabled = gameState.currentPlayer !== "player2";
}

function gameOver(winner) {
    gameState.phase = "gameOver";
    gameState.activePhase = "gameOver";
    updatePhaseDisplay();
    
    let resultText = "";
    let detailsText = "";
    
    if (winner === "player1") {
        resultText = "Player 1 Wins!";
        detailsText = "Player 1 has defeated Player 2's hero!";
    } else if (winner === "player2") {
        resultText = "Player 2 Wins!";
        detailsText = "Player 2 has defeated Player 1's hero!";
    } else if (gameState.day > 18) {
        resultText = "Draw!";
        detailsText = "The maximum number of days (18) has been reached. Both players lose.";
    }
    
    DOM.gameResult.textContent = resultText;
    DOM.gameResultDetails.textContent = detailsText;
    DOM.gameOverModal.style.display = "flex";
}

// Initialize the game
document.addEventListener("DOMContentLoaded", initGame);
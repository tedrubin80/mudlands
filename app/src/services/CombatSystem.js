const chalk = require('chalk');

class CombatSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.activeCombats = new Map();
    }

    initiateAttack(player, monster) {
        if (player.currentHp <= 0) {
            return { success: false, message: "You are too weak to fight!" };
        }

        if (monster.currentHp <= 0) {
            return { success: false, message: "That target is already defeated." };
        }

        const combatId = `${player.id}-${monster.id}`;
        
        if (!this.activeCombats.has(combatId)) {
            this.activeCombats.set(combatId, {
                player,
                monster,
                turn: 'player',
                rounds: 0
            });
        }

        const result = this.calculateDamage(player, monster);
        
        let output = [];
        
        if (result.dodged) {
            output.push(chalk.cyan(`${monster.name} dodges your attack!`));
        } else {
            monster.takeDamage(result.damage);
            if (result.critical) {
                output.push(chalk.red.bold(`CRITICAL HIT! You strike ${monster.name} for ${result.damage} damage!`));
            } else {
                output.push(chalk.red(`You attack ${monster.name} for ${result.damage} damage!`));
            }
        }

        if (monster.currentHp <= 0) {
            output.push(chalk.green.bold(`You have defeated ${monster.name}!`));
            
            // Update quest progress for monster kills
            this.gameEngine.questManager.updateQuestProgress(player, 'monster_killed', {
                monsterType: monster.id || monster.name.toLowerCase().replace(' ', '_'),
                monsterId: monster.id
            });
            
            // Give experience
            const expGained = monster.experience || 0;
            if (expGained > 0) {
                player.gainExperience(expGained);
                output.push(chalk.yellow(`You gained ${expGained} experience!`));
            }
            
            // Give gold
            if (monster.gold && monster.gold > 0) {
                player.gold = (player.gold || 0) + monster.gold;
                output.push(chalk.yellow(`You found ${monster.gold} gold!`));
            }
            
            // Handle loot drops
            const lootMessages = this.handleLootDrops(monster, player);
            output.push(...lootMessages);
            
            const room = this.gameEngine.world.getRoom(player.location);
            if (room) {
                room.removeMonster(monster.id);
            }
            
            this.activeCombats.delete(combatId);
            
            // Schedule respawn based on monster data
            const respawnTime = monster.respawnTime ? monster.respawnTime * 1000 : 60000;
            setTimeout(() => {
                this.gameEngine.world.respawnMonster(player.location, monster.id, respawnTime);
            }, respawnTime);
        } else {
            const monsterResult = this.calculateDamage(monster, player);
            
            if (monsterResult.dodged) {
                output.push(chalk.cyan(`You dodge ${monster.name}'s attack!`));
            } else {
                player.takeDamage(monsterResult.damage);
                if (monsterResult.critical) {
                    output.push(chalk.red.bold(`${monster.name} scores a critical hit for ${monsterResult.damage} damage!`));
                } else {
                    output.push(chalk.red(`${monster.name} hits you for ${monsterResult.damage} damage!`));
                }
            }
            
            if (player.currentHp <= 0) {
                output.push(chalk.red.bold("You have been defeated!"));
                output.push(chalk.yellow("You respawn at the town square..."));
                player.currentHp = Math.floor(player.maxHp * 0.5);
                player.location = 'town_square';
                this.activeCombats.delete(combatId);
            }
        }

        return { success: true, message: output.join('\n') };
    }

    handleLootDrops(monster, player) {
        const lootMessages = [];
        
        if (!monster.loot || monster.loot.length === 0) {
            return lootMessages;
        }

        monster.loot.forEach(lootEntry => {
            const chance = Math.random();
            if (chance <= lootEntry.chance) {
                const item = this.gameEngine.world.createItem(lootEntry.id, 1);
                if (item) {
                    player.addItem(item);
                    lootMessages.push(chalk.cyan(`You found: ${item.name}!`));
                }
            }
        });

        return lootMessages;
    }

    calculateDamage(attacker, defender) {
        // Base damage calculation with level scaling
        const attackPower = attacker.stats.str || 5;
        const attackerLevel = attacker.level || 1;
        const baseDamage = attackPower * 2 + (attackerLevel * 3);
        
        // Defense calculation with diminishing returns
        const defenderVit = defender.stats.vit || 5;
        const defenderAgi = defender.stats.agi || 5;
        const defense = defenderVit + Math.floor(defenderAgi * 0.3);
        const damageReduction = defense / (defense + 50); // Soft cap formula
        
        // Critical hit chance based on dex and luck
        const critChance = Math.min(0.5, ((attacker.stats.dex || 5) + (attacker.stats.luk || 5)) / 100);
        const isCritical = Math.random() < critChance;
        const critMultiplier = isCritical ? 1.5 : 1.0;
        
        // Dodge chance based on agility difference
        const agiDifference = (defender.stats.agi || 5) - (attacker.stats.dex || 5);
        const dodgeChance = Math.min(0.3, Math.max(0, agiDifference * 0.02));
        if (Math.random() < dodgeChance) {
            return { damage: 0, dodged: true };
        }
        
        // Final damage calculation with variance
        const variance = Math.random() * 0.3 + 0.85; // 85%-115% damage variance
        const rawDamage = baseDamage * (1 - damageReduction) * critMultiplier * variance;
        const finalDamage = Math.max(1, Math.floor(rawDamage));
        
        return { 
            damage: finalDamage, 
            critical: isCritical,
            dodged: false
        };
    }

    processCombat() {
        for (const [combatId, combat] of this.activeCombats) {
            if (combat.turn === 'monster' && combat.monster.currentHp > 0 && combat.player.currentHp > 0) {
                const result = this.calculateDamage(combat.monster, combat.player);
                
                let message;
                if (result.dodged) {
                    message = chalk.cyan(`You dodge ${combat.monster.name}'s attack!`);
                } else {
                    combat.player.takeDamage(result.damage);
                    if (result.critical) {
                        message = chalk.red.bold(`${combat.monster.name} scores a critical hit for ${result.damage} damage!`);
                    } else {
                        message = chalk.red(`${combat.monster.name} attacks you for ${result.damage} damage!`);
                    }
                }
                
                this.gameEngine.emit('messageToPlayer', {
                    playerId: combat.player.id,
                    message: message
                });
                
                if (combat.player.currentHp <= 0) {
                    this.gameEngine.emit('messageToPlayer', {
                        playerId: combat.player.id,
                        message: chalk.red.bold("You have been defeated!\n") + 
                                chalk.yellow("You respawn at the town square...")
                    });
                    combat.player.currentHp = Math.floor(combat.player.maxHp * 0.5);
                    combat.player.location = 'town_square';
                    this.activeCombats.delete(combatId);
                }
                
                combat.turn = 'player';
            }
        }
    }
}

module.exports = CombatSystem;
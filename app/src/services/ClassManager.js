const chalk = require('chalk');
const GameLogger = require('../utils/logger');

class ClassManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.classTemplates = this.initializeClasses();
        this.skillTrees = this.initializeSkillTrees();
    }

    initializeClasses() {
        return {
            // Starting Class
            'novice': {
                id: 'novice',
                name: 'Novice',
                description: 'A beginning adventurer ready to choose their path.',
                tier: 0,
                requirements: { level: 1 },
                stat_bonuses: {},
                advancement_options: ['warrior', 'mage', 'archer', 'merchant', 'thief', 'acolyte'],
                base_skills: ['basic_attack', 'rest'],
                advancement_level: 10,
                advancement_quest: null
            },

            // Tier 1 Classes (Level 10)
            'warrior': {
                id: 'warrior', 
                name: 'Warrior',
                description: 'A strong fighter skilled in melee combat.',
                tier: 1,
                requirements: { 
                    level: 10, 
                    base_class: 'novice',
                    stats: { str: 15, vit: 12 }
                },
                stat_bonuses: { str: 5, vit: 3, hp_multiplier: 1.5 },
                advancement_options: ['knight', 'berserker'],
                base_skills: ['power_attack', 'defensive_stance', 'weapon_mastery'],
                advancement_level: 25,
                advancement_quest: 'warrior_trial'
            },

            'mage': {
                id: 'mage',
                name: 'Mage', 
                description: 'A wielder of arcane magic and mystical knowledge.',
                tier: 1,
                requirements: {
                    level: 10,
                    base_class: 'novice', 
                    stats: { int: 15, dex: 10 }
                },
                stat_bonuses: { int: 5, dex: 2, mp_multiplier: 2.0 },
                advancement_options: ['wizard', 'sorcerer'],
                base_skills: ['magic_missile', 'mana_shield', 'spell_focus'],
                advancement_level: 25,
                advancement_quest: 'mage_trials'
            },

            'archer': {
                id: 'archer',
                name: 'Archer',
                description: 'A skilled marksman with bow and arrow.',
                tier: 1,
                requirements: {
                    level: 10,
                    base_class: 'novice',
                    stats: { dex: 15, agi: 12 }
                },
                stat_bonuses: { dex: 5, agi: 3, accuracy_bonus: 10 },
                advancement_options: ['hunter', 'ranger'],
                base_skills: ['precise_shot', 'quick_draw', 'track'],
                advancement_level: 25, 
                advancement_quest: 'archer_mastery'
            },

            'merchant': {
                id: 'merchant',
                name: 'Merchant',
                description: 'A trader skilled in commerce and negotiation.',
                tier: 1,
                requirements: {
                    level: 10,
                    base_class: 'novice',
                    stats: { int: 12, luk: 15 }
                },
                stat_bonuses: { int: 3, luk: 5, gold_bonus: 1.5 },
                advancement_options: ['blacksmith', 'alchemist'],
                base_skills: ['appraise', 'haggle', 'merchant_network'],
                advancement_level: 25,
                advancement_quest: 'merchant_guild_trial'
            },

            'thief': {
                id: 'thief',
                name: 'Thief',
                description: 'A stealthy rogue skilled in subterfuge.',
                tier: 1,
                requirements: {
                    level: 10,
                    base_class: 'novice',
                    stats: { agi: 15, dex: 12 }
                },
                stat_bonuses: { agi: 5, dex: 3, crit_chance: 10 },
                advancement_options: ['assassin', 'rogue'],
                base_skills: ['sneak_attack', 'stealth', 'lockpicking'],
                advancement_level: 25,
                advancement_quest: 'thieves_guild_initiation'
            },

            'acolyte': {
                id: 'acolyte',
                name: 'Acolyte', 
                description: 'A devoted servant of divine powers.',
                tier: 1,
                requirements: {
                    level: 10,
                    base_class: 'novice',
                    stats: { int: 12, vit: 12, reputation: { temple: 25 } }
                },
                stat_bonuses: { int: 3, vit: 3, healing_power: 1.5 },
                advancement_options: ['priest', 'monk'],
                base_skills: ['heal', 'bless', 'turn_undead'],
                advancement_level: 25,
                advancement_quest: 'divine_calling'
            },

            // Tier 2 Classes (Level 25)
            'knight': {
                id: 'knight',
                name: 'Knight',
                description: 'An honorable warrior dedicated to protection and justice.',
                tier: 2,
                requirements: {
                    level: 25,
                    base_class: 'warrior',
                    reputation: { guards: 50 },
                    completed_quests: ['warrior_trial']
                },
                stat_bonuses: { str: 8, vit: 6, hp_multiplier: 2.0, def_bonus: 15 },
                advancement_options: ['paladin', 'crusader'],
                base_skills: ['shield_wall', 'provoke', 'noble_strike', 'armor_mastery'],
                advancement_level: 40,
                advancement_quest: 'knights_oath'
            },

            'berserker': {
                id: 'berserker',
                name: 'Berserker',
                description: 'A fierce warrior who fights with primal fury.',
                tier: 2,
                requirements: {
                    level: 25,
                    base_class: 'warrior',
                    stats: { str: 25 },
                    completed_quests: ['warrior_trial']
                },
                stat_bonuses: { str: 10, agi: 4, rage_mode: true, crit_damage: 1.5 },
                advancement_options: ['warlord', 'savage'],
                base_skills: ['berserk_rage', 'intimidate', 'dual_wield', 'bloodlust'],
                advancement_level: 40,
                advancement_quest: 'berserker_rampage'
            },

            'wizard': {
                id: 'wizard',
                name: 'Wizard',
                description: 'A master of elemental magic and arcane lore.',
                tier: 2,
                requirements: {
                    level: 25,
                    base_class: 'mage',
                    stats: { int: 25 },
                    completed_quests: ['mage_trials']
                },
                stat_bonuses: { int: 8, dex: 4, mp_multiplier: 2.5, spell_power: 1.5 },
                advancement_options: ['archmage', 'elementalist'],
                base_skills: ['fireball', 'ice_bolt', 'lightning', 'teleport'],
                advancement_level: 40,
                advancement_quest: 'wizards_test'
            },

            'sorcerer': {
                id: 'sorcerer',
                name: 'Sorcerer',
                description: 'A wielder of raw magical power and chaos.',
                tier: 2,
                requirements: {
                    level: 25,
                    base_class: 'mage',
                    stats: { int: 22, luk: 18 },
                    completed_quests: ['mage_trials']
                },
                stat_bonuses: { int: 6, luk: 6, mp_multiplier: 2.2, wild_magic: true },
                advancement_options: ['chaos_mage', 'battle_mage'],
                base_skills: ['magic_burst', 'wild_surge', 'spell_steal', 'metamagic'],
                advancement_level: 40,
                advancement_quest: 'chaos_awakening'
            },

            'hunter': {
                id: 'hunter',
                name: 'Hunter',
                description: 'A tracker and beast master of the wilderness.',
                tier: 2,
                requirements: {
                    level: 25,
                    base_class: 'archer',
                    stats: { dex: 25, int: 15 },
                    completed_quests: ['archer_mastery']
                },
                stat_bonuses: { dex: 8, int: 4, animal_companion: true, tracking: true },
                advancement_options: ['beast_master', 'sniper'],
                base_skills: ['animal_companion', 'trap_making', 'camouflage', 'multi_shot'],
                advancement_level: 40,
                advancement_quest: 'master_hunter_trial'
            },

            'ranger': {
                id: 'ranger',
                name: 'Ranger',
                description: 'A guardian of nature and protector of the wilderness.',
                tier: 2,
                requirements: {
                    level: 25,
                    base_class: 'archer',
                    stats: { dex: 22, vit: 18 },
                    reputation: { druids: 35 },
                    completed_quests: ['archer_mastery']
                },
                stat_bonuses: { dex: 6, vit: 6, nature_magic: true, wilderness_survival: true },
                advancement_options: ['druid_ranger', 'forest_guardian'],
                base_skills: ['nature_magic', 'wilderness_lore', 'twin_shot', 'forest_stride'],
                advancement_level: 40,
                advancement_quest: 'natures_calling'
            }
        };
    }

    initializeSkillTrees() {
        return {
            warrior: {
                combat_mastery: {
                    name: 'Combat Mastery',
                    skills: {
                        weapon_expertise: { level: 1, cost: 1 },
                        armor_proficiency: { level: 3, cost: 1 },
                        combat_reflexes: { level: 5, cost: 2 },
                        weapon_specialization: { level: 8, cost: 2 }
                    }
                },
                defensive_arts: {
                    name: 'Defensive Arts', 
                    skills: {
                        shield_block: { level: 2, cost: 1 },
                        damage_reduction: { level: 4, cost: 1 },
                        shield_mastery: { level: 6, cost: 2 },
                        fortress_stance: { level: 10, cost: 3 }
                    }
                }
            },
            mage: {
                elemental_magic: {
                    name: 'Elemental Magic',
                    skills: {
                        fire_mastery: { level: 1, cost: 1 },
                        ice_mastery: { level: 2, cost: 1 },
                        lightning_mastery: { level: 3, cost: 1 },
                        elemental_fusion: { level: 8, cost: 3 }
                    }
                },
                arcane_knowledge: {
                    name: 'Arcane Knowledge',
                    skills: {
                        mana_efficiency: { level: 1, cost: 1 },
                        spell_penetration: { level: 4, cost: 2 },
                        arcane_mastery: { level: 6, cost: 2 },
                        reality_manipulation: { level: 12, cost: 4 }
                    }
                }
            }
            // Additional skill trees would be defined here...
        };
    }

    // Check if player can advance to a specific class
    canAdvanceToClass(player, targetClassId) {
        const targetClass = this.classTemplates[targetClassId];
        if (!targetClass) {
            return { canAdvance: false, reason: 'Class not found' };
        }

        const requirements = targetClass.requirements;

        // Level check
        if (player.level < requirements.level) {
            return { 
                canAdvance: false, 
                reason: `Requires level ${requirements.level} (you are ${player.level})` 
            };
        }

        // Base class check
        if (requirements.base_class && player.className !== requirements.base_class) {
            return { 
                canAdvance: false, 
                reason: `Must be a ${requirements.base_class} first` 
            };
        }

        // Stat requirements
        if (requirements.stats) {
            for (const [stat, required] of Object.entries(requirements.stats)) {
                if (stat === 'reputation') continue; // Handle reputation separately
                
                const playerStat = player.stats[stat] || 0;
                if (playerStat < required) {
                    return { 
                        canAdvance: false, 
                        reason: `Requires ${stat.toUpperCase()} ${required} (you have ${playerStat})` 
                    };
                }
            }
        }

        // Reputation requirements  
        if (requirements.stats?.reputation) {
            for (const [faction, required] of Object.entries(requirements.stats.reputation)) {
                const playerRep = player.getReputation ? player.getReputation(faction) : 0;
                if (playerRep < required) {
                    return { 
                        canAdvance: false, 
                        reason: `Requires ${faction} reputation ${required}` 
                    };
                }
            }
        }

        // Quest requirements
        if (requirements.completed_quests) {
            for (const questId of requirements.completed_quests) {
                if (!player.hasCompletedQuest || !player.hasCompletedQuest(questId)) {
                    return { 
                        canAdvance: false, 
                        reason: `Must complete quest: ${questId}` 
                    };
                }
            }
        }

        return { canAdvance: true };
    }

    // Advance player to new class
    advancePlayerClass(player, targetClassId) {
        const canAdvance = this.canAdvanceToClass(player, targetClassId);
        if (!canAdvance.canAdvance) {
            return { success: false, message: canAdvance.reason };
        }

        const newClass = this.classTemplates[targetClassId];
        const oldClassName = player.className;

        // Apply class change
        player.className = newClass.id;
        player.classDisplayName = newClass.name;

        // Apply stat bonuses
        if (newClass.stat_bonuses) {
            for (const [stat, bonus] of Object.entries(newClass.stat_bonuses)) {
                if (stat === 'hp_multiplier' || stat === 'mp_multiplier') {
                    continue; // Handle multipliers separately
                }
                
                if (player.stats[stat] !== undefined) {
                    player.stats[stat] += bonus;
                }
            }

            // Recalculate HP/MP with new multipliers
            if (newClass.stat_bonuses.hp_multiplier) {
                const hpBonus = Math.floor(player.stats.vit * (newClass.stat_bonuses.hp_multiplier - 1));
                player.maxHp += hpBonus;
                player.currentHp = Math.min(player.currentHp + hpBonus, player.maxHp);
            }

            if (newClass.stat_bonuses.mp_multiplier) {
                const mpBonus = Math.floor(player.stats.int * (newClass.stat_bonuses.mp_multiplier - 1));
                player.maxMp += mpBonus;
                player.currentMp = Math.min(player.currentMp + mpBonus, player.maxMp);
            }
        }

        // Grant class skills
        if (newClass.base_skills && !player.skills) {
            player.skills = [];
        }
        
        if (newClass.base_skills) {
            for (const skill of newClass.base_skills) {
                if (player.skills && !player.skills.includes(skill)) {
                    player.skills.push(skill);
                }
            }
        }

        // Log the advancement
        GameLogger.playerAction(player.id, player.name, 'class_advancement', {
            oldClass: oldClassName,
            newClass: newClass.name,
            level: player.level
        });

        return { 
            success: true, 
            message: `Congratulations! You are now a ${newClass.name}!`,
            newClass: newClass
        };
    }

    // Get available advancement options for player
    getAvailableAdvancements(player) {
        const currentClass = this.classTemplates[player.className];
        if (!currentClass || !currentClass.advancement_options) {
            return [];
        }

        const availableAdvancements = [];

        for (const classId of currentClass.advancement_options) {
            const advancement = this.classTemplates[classId];
            const canAdvance = this.canAdvanceToClass(player, classId);
            
            availableAdvancements.push({
                class: advancement,
                available: canAdvance.canAdvance,
                reason: canAdvance.reason || null
            });
        }

        return availableAdvancements;
    }

    // Get class information
    getClassInfo(classId) {
        return this.classTemplates[classId] || null;
    }

    // Get all classes by tier
    getClassesByTier(tier) {
        return Object.values(this.classTemplates).filter(cls => cls.tier === tier);
    }

    // Check if player meets advancement level for current class
    canConsiderAdvancement(player) {
        const currentClass = this.classTemplates[player.className];
        if (!currentClass) return false;
        
        return player.level >= currentClass.advancement_level;
    }

    // Get formatted class progression info
    getClassProgression(player) {
        const currentClass = this.classTemplates[player.className];
        if (!currentClass) return null;

        const progression = {
            current: currentClass,
            canAdvance: this.canConsiderAdvancement(player),
            advancementLevel: currentClass.advancement_level,
            availableAdvancements: this.getAvailableAdvancements(player)
        };

        return progression;
    }
}

module.exports = ClassManager;
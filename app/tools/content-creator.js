#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const StoryGenerator = require('../src/tools/StoryGenerator');

class ContentCreatorCLI {
    constructor() {
        this.storyGenerator = new StoryGenerator();
        this.outputDir = path.join(__dirname, '../content');
        this.ensureOutputDirectory();
    }
    
    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        const subDirs = ['npcs', 'quests', 'rooms', 'generated'];
        subDirs.forEach(dir => {
            const fullPath = path.join(this.outputDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath);
            }
        });
    }
    
    run() {
        const args = process.argv.slice(2);
        const command = args[0];
        
        switch(command) {
            case 'npc':
                this.generateNPC(args.slice(1));
                break;
            case 'quest':
                this.generateQuest(args.slice(1));
                break;
            case 'room':
                this.generateRoom(args.slice(1));
                break;
            case 'batch':
                this.generateBatch(args.slice(1));
                break;
            case 'help':
            default:
                this.showHelp();
                break;
        }
    }
    
    generateNPC(args) {
        const options = this.parseNPCOptions(args);
        
        console.log('Generating NPC...');
        console.log('Options:', options);
        
        const npc = this.storyGenerator.generateNPC(options);
        
        // Display the NPC
        console.log('\n=== Generated NPC ===');
        console.log(`Name: ${npc.name}`);
        console.log(`Race: ${npc.race} (${npc.gender})`);
        console.log(`Role: ${options.role || 'citizen'}`);
        console.log('\nDescription:');
        console.log(npc.getDescription());
        console.log('\nPersonality:');
        console.log(`Values: ${npc.personality.values.join(', ')}`);
        console.log(`Goals: ${npc.personality.objectives.join(', ')}`);
        console.log(`Identity: ${npc.personality.identity}`);
        console.log('\nKnowledge:');
        console.log(`Topics: ${npc.knowledge.topics.join(', ')}`);
        if (npc.knowledge.secrets.length > 0) {
            console.log(`Secrets: ${npc.knowledge.secrets.join(', ')}`);
        }
        console.log('\nGreeting:');
        console.log(`"${npc.speech.greeting}"`);
        
        // Save to file
        const filename = `${npc.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
        const filepath = path.join(this.outputDir, 'npcs', filename);
        fs.writeFileSync(filepath, JSON.stringify(npc.toJSON(), null, 2));
        console.log(`\nSaved to: ${filepath}`);
    }
    
    parseNPCOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            
            if (key && value) {
                switch(key) {
                    case '--race':
                        options.race = value;
                        break;
                    case '--gender':
                        options.gender = value;
                        break;
                    case '--role':
                        options.role = value;
                        break;
                    case '--location':
                        options.location = value;
                        break;
                    case '--name':
                        options.name = value;
                        break;
                }
            }
        }
        
        return options;
    }
    
    generateQuest(args) {
        const options = this.parseQuestOptions(args);
        
        console.log('Generating Quest...');
        console.log('Options:', options);
        
        const quest = this.storyGenerator.generateQuest(options);
        
        // Display the quest
        console.log('\n=== Generated Quest ===');
        console.log(`Title: ${quest.title}`);
        console.log(`Type: ${quest.type} (${quest.difficulty})`);
        console.log(`Level Requirement: ${quest.level_requirement}`);
        console.log('\nNarrative:');
        console.log(`Hook: ${quest.narrative.hook}`);
        console.log(`Background: ${quest.narrative.background}`);
        console.log(`Stakes: ${quest.narrative.stakes}`);
        console.log(`Resolution: ${quest.narrative.resolution}`);
        console.log('\nObjectives:');
        quest.objectives.forEach((obj, i) => {
            console.log(`${i + 1}. ${obj.description}`);
        });
        console.log('\nRewards:');
        console.log(`Experience: ${quest.rewards.experience}`);
        console.log(`Gold: ${quest.rewards.gold}`);
        if (quest.rewards.items.length > 0) {
            console.log(`Items: ${quest.rewards.items.join(', ')}`);
        }
        
        // Save to file
        const filename = `${quest.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
        const filepath = path.join(this.outputDir, 'quests', filename);
        fs.writeFileSync(filepath, JSON.stringify(quest.toJSON(), null, 2));
        console.log(`\nSaved to: ${filepath}`);
    }
    
    parseQuestOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            
            if (key && value) {
                switch(key) {
                    case '--type':
                        options.type = value;
                        break;
                    case '--difficulty':
                        options.difficulty = value;
                        break;
                    case '--level':
                        options.level = parseInt(value);
                        break;
                    case '--title':
                        options.title = value;
                        break;
                }
            }
        }
        
        return options;
    }
    
    generateRoom(args) {
        const options = this.parseRoomOptions(args);
        
        console.log('Generating Room...');
        console.log('Options:', options);
        
        const description = this.storyGenerator.generateRoomDescription(options);
        
        // Create a room object
        const room = {
            id: options.id || `room_${Date.now()}`,
            name: options.name || 'Generated Room',
            description: description,
            exits: options.exits || {},
            atmosphere: options.atmosphere || 'mysterious',
            generated_at: Date.now()
        };
        
        // Display the room
        console.log('\n=== Generated Room ===');
        console.log(`Name: ${room.name}`);
        console.log(`ID: ${room.id}`);
        console.log('\nDescription:');
        console.log(room.description);
        
        // Save to file
        const filename = `${room.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
        const filepath = path.join(this.outputDir, 'rooms', filename);
        fs.writeFileSync(filepath, JSON.stringify(room, null, 2));
        console.log(`\nSaved to: ${filepath}`);
    }
    
    parseRoomOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            
            if (key && value) {
                switch(key) {
                    case '--name':
                        options.name = value;
                        break;
                    case '--id':
                        options.id = value;
                        break;
                    case '--atmosphere':
                        options.atmosphere = value;
                        break;
                }
            }
        }
        
        return options;
    }
    
    generateBatch(args) {
        const type = args[0] || 'mixed';
        const count = parseInt(args[1]) || 5;
        
        console.log(`Generating batch of ${count} ${type} content...`);
        
        const results = {
            npcs: [],
            quests: [],
            rooms: []
        };
        
        if (type === 'mixed' || type === 'npcs') {
            for (let i = 0; i < (type === 'mixed' ? Math.ceil(count / 3) : count); i++) {
                const npc = this.storyGenerator.generateNPC();
                results.npcs.push(npc);
            }
        }
        
        if (type === 'mixed' || type === 'quests') {
            for (let i = 0; i < (type === 'mixed' ? Math.ceil(count / 3) : count); i++) {
                const quest = this.storyGenerator.generateQuest();
                results.quests.push(quest);
            }
        }
        
        if (type === 'mixed' || type === 'rooms') {
            for (let i = 0; i < (type === 'mixed' ? Math.ceil(count / 3) : count); i++) {
                const description = this.storyGenerator.generateRoomDescription();
                const room = {
                    id: `batch_room_${i}_${Date.now()}`,
                    name: `Generated Room ${i + 1}`,
                    description: description,
                    exits: {},
                    generated_at: Date.now()
                };
                results.rooms.push(room);
            }
        }
        
        // Save batch file
        const batchData = {
            generated_at: Date.now(),
            type: type,
            count: count,
            results: results
        };
        
        const filename = `batch_${type}_${count}_${Date.now()}.json`;
        const filepath = path.join(this.outputDir, 'generated', filename);
        fs.writeFileSync(filepath, JSON.stringify(batchData, null, 2));
        
        console.log('\n=== Batch Generation Complete ===');
        console.log(`NPCs generated: ${results.npcs.length}`);
        console.log(`Quests generated: ${results.quests.length}`);
        console.log(`Rooms generated: ${results.rooms.length}`);
        console.log(`\nSaved to: ${filepath}`);
        
        // Show sample of generated content
        if (results.npcs.length > 0) {
            console.log(`\nSample NPC: ${results.npcs[0].name} (${results.npcs[0].race} ${results.npcs[0].gender})`);
        }
        if (results.quests.length > 0) {
            console.log(`Sample Quest: ${results.quests[0].title} (${results.quests[0].type})`);
        }
        if (results.rooms.length > 0) {
            console.log(`Sample Room: ${results.rooms[0].name}`);
        }
    }
    
    showHelp() {
        console.log(`
MUDlands Content Creator CLI

Usage: node content-creator.js [command] [options]

Commands:
  npc     Generate a new NPC
  quest   Generate a new quest
  room    Generate a new room description
  batch   Generate multiple content items
  help    Show this help message

NPC Options:
  --race [human|elf|dwarf|halfling]
  --gender [male|female|neutral]
  --role [merchant|guard|scholar|farmer|innkeeper|citizen]
  --location [location_id]
  --name [custom_name]

Quest Options:
  --type [fetch|kill|delivery|social|explore]
  --difficulty [easy|medium|hard|epic]
  --level [number]
  --title [custom_title]

Room Options:
  --name [room_name]
  --id [room_id]
  --atmosphere [peaceful|eerie|bustling|abandoned|mysterious|welcoming]

Batch Options:
  batch [mixed|npcs|quests|rooms] [count]

Examples:
  node content-creator.js npc --race elf --role merchant --location town_market
  node content-creator.js quest --type fetch --difficulty medium --level 5
  node content-creator.js room --name "Mystic Library" --atmosphere mysterious
  node content-creator.js batch mixed 10
  node content-creator.js batch npcs 5

Generated content is saved to the content/ directory.
        `);
    }
}

// Run the CLI
if (require.main === module) {
    const cli = new ContentCreatorCLI();
    cli.run();
}

module.exports = ContentCreatorCLI;
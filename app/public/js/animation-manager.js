/**
 * MUDlands Animation Manager
 * Handles Phaser.js animations and tweens for entities
 */

class AnimationManager {
    constructor(scene) {
        this.scene = scene;
        this.activeTweens = new Map();
        this.idleAnimations = new Map();
    }

    // ============================================
    // Idle Animations
    // ============================================

    /**
     * Add breathing/sway idle animation to entity
     */
    addIdleAnimation(entityId, container) {
        // Remove existing idle animation
        this.removeIdleAnimation(entityId);

        // Subtle breathing effect
        const tween = this.scene.tweens.add({
            targets: container,
            scaleY: { from: 1, to: 1.02 },
            scaleX: { from: 1, to: 0.99 },
            duration: 1500 + Math.random() * 500, // Slight variation
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.idleAnimations.set(entityId, tween);
        return tween;
    }

    /**
     * Add hovering/floating animation (for ghosts, magic)
     */
    addFloatAnimation(entityId, container, amplitude = 5) {
        this.removeIdleAnimation(entityId);

        const tween = this.scene.tweens.add({
            targets: container,
            y: { from: container.y - amplitude, to: container.y + amplitude },
            duration: 2000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.idleAnimations.set(entityId, tween);
        return tween;
    }

    /**
     * Add pulsing glow animation
     */
    addGlowPulse(entityId, glowObject, minAlpha = 0.1, maxAlpha = 0.4) {
        const tween = this.scene.tweens.add({
            targets: glowObject,
            alpha: { from: minAlpha, to: maxAlpha },
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Store with composite key
        this.activeTweens.set(`${entityId}_glow`, tween);
        return tween;
    }

    /**
     * Remove idle animation
     */
    removeIdleAnimation(entityId) {
        const tween = this.idleAnimations.get(entityId);
        if (tween) {
            tween.stop();
            this.idleAnimations.delete(entityId);
        }
    }

    // ============================================
    // Combat Animations
    // ============================================

    /**
     * Play attack animation
     */
    playAttackAnimation(attackerContainer, targetContainer, onComplete) {
        const originalX = attackerContainer.x;
        const originalY = attackerContainer.y;
        const targetX = targetContainer.x;

        // Calculate lunge distance (move toward target)
        const lungeDistance = Math.min(50, Math.abs(targetX - originalX) * 0.3);
        const direction = targetX > originalX ? 1 : -1;

        // Attack timeline
        this.scene.tweens.timeline({
            tweens: [
                {
                    targets: attackerContainer,
                    x: originalX + (lungeDistance * direction),
                    duration: 150,
                    ease: 'Power2'
                },
                {
                    targets: attackerContainer,
                    x: originalX,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: onComplete
                }
            ]
        });
    }

    /**
     * Play damage flash effect
     */
    playDamageFlash(container, onComplete) {
        // Store original tint/color
        const children = container.list;

        // Flash red
        this.scene.tweens.add({
            targets: container,
            alpha: { from: 1, to: 0.3 },
            duration: 100,
            yoyo: true,
            repeat: 2,
            ease: 'Stepped',
            onStart: () => {
                // Tint red (if graphics objects support it)
                children.forEach(child => {
                    if (child.setTint) {
                        child.setTint(0xff0000);
                    }
                });
            },
            onComplete: () => {
                // Clear tint
                children.forEach(child => {
                    if (child.clearTint) {
                        child.clearTint();
                    }
                });
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Play shake effect (for heavy hits)
     */
    playShakeEffect(container, intensity = 3, duration = 200) {
        const originalX = container.x;
        const originalY = container.y;

        this.scene.tweens.add({
            targets: container,
            x: { from: originalX - intensity, to: originalX + intensity },
            y: { from: originalY - intensity / 2, to: originalY + intensity / 2 },
            duration: 50,
            yoyo: true,
            repeat: Math.floor(duration / 100),
            ease: 'Stepped',
            onComplete: () => {
                container.x = originalX;
                container.y = originalY;
            }
        });
    }

    /**
     * Play death/fade out animation
     */
    playDeathAnimation(container, onComplete) {
        // Stop idle animation
        this.scene.tweens.add({
            targets: container,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            y: container.y + 30,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                container.destroy();
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Play spell/magic effect
     */
    playSpellEffect(casterContainer, targetContainer, spellColor = 0x8888ff) {
        const startX = casterContainer.x;
        const startY = casterContainer.y - 30;
        const endX = targetContainer.x;
        const endY = targetContainer.y - 30;

        // Create magic projectile
        const projectile = this.scene.add.circle(startX, startY, 8, spellColor, 1);
        projectile.setBlendMode(Phaser.BlendModes.ADD);

        // Create trail effect
        const trail = this.scene.add.circle(startX, startY, 15, spellColor, 0.3);
        trail.setBlendMode(Phaser.BlendModes.ADD);

        // Animate projectile
        this.scene.tweens.add({
            targets: [projectile, trail],
            x: endX,
            y: endY,
            duration: 400,
            ease: 'Power2',
            onUpdate: () => {
                trail.x = projectile.x;
                trail.y = projectile.y;
            },
            onComplete: () => {
                // Impact effect
                this.playDamageFlash(targetContainer);

                // Fade out projectile
                this.scene.tweens.add({
                    targets: [projectile, trail],
                    alpha: 0,
                    scale: 2,
                    duration: 200,
                    onComplete: () => {
                        projectile.destroy();
                        trail.destroy();
                    }
                });
            }
        });
    }

    // ============================================
    // Movement Animations
    // ============================================

    /**
     * Smooth move to position
     */
    moveTo(container, x, y, duration = 300, onComplete) {
        return this.scene.tweens.add({
            targets: container,
            x: x,
            y: y,
            duration: duration,
            ease: 'Power2',
            onComplete: onComplete
        });
    }

    /**
     * Room transition animation (fade out/in)
     */
    playRoomTransition(direction, onMidpoint, onComplete) {
        const camera = this.scene.cameras.main;

        // Direction-based pan
        const panAmount = 100;
        const panX = direction === 'east' ? panAmount : direction === 'west' ? -panAmount : 0;
        const panY = direction === 'south' ? panAmount : direction === 'north' ? -panAmount : 0;

        // Fade out with pan
        this.scene.tweens.add({
            targets: camera,
            scrollX: camera.scrollX + panX,
            scrollY: camera.scrollY + panY,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                if (onMidpoint) onMidpoint();

                // Reset camera and fade in
                camera.scrollX = -panX / 2;
                camera.scrollY = -panY / 2;

                this.scene.tweens.add({
                    targets: camera,
                    scrollX: 0,
                    scrollY: 0,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: onComplete
                });
            }
        });
    }

    // ============================================
    // Item/Loot Animations
    // ============================================

    /**
     * Play loot sparkle effect
     */
    playLootSparkle(x, y, duration = 1000) {
        const particles = [];
        const colors = [0xffff00, 0xffcc00, 0xffffff];

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.scene.add.circle(x, y, 3, colors[i % 3], 1);
            particle.setBlendMode(Phaser.BlendModes.ADD);
            particles.push(particle);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30 - 20,
                alpha: 0,
                scale: 0.5,
                duration: duration,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Play item pickup effect
     */
    playItemPickup(itemContainer, targetY, onComplete) {
        this.scene.tweens.add({
            targets: itemContainer,
            y: targetY - 50,
            alpha: 0,
            scale: 0.5,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                itemContainer.destroy();
                if (onComplete) onComplete();
            }
        });
    }

    // ============================================
    // Level Up / Achievement Animations
    // ============================================

    /**
     * Play level up celebration
     */
    playLevelUpEffect(container) {
        // Golden glow burst
        const glow = this.scene.add.circle(container.x, container.y, 10, 0xffdd00, 0.8);
        glow.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: glow,
            scale: 8,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => glow.destroy()
        });

        // Rising stars
        for (let i = 0; i < 5; i++) {
            const star = this.scene.add.text(
                container.x + (Math.random() - 0.5) * 60,
                container.y,
                '★',
                { fontSize: '16px', fill: '#ffdd00' }
            ).setOrigin(0.5);

            this.scene.tweens.add({
                targets: star,
                y: container.y - 100,
                alpha: 0,
                duration: 1000 + Math.random() * 500,
                ease: 'Power2',
                delay: i * 100,
                onComplete: () => star.destroy()
            });
        }

        // Bounce the character
        this.scene.tweens.add({
            targets: container,
            y: container.y - 20,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Stop all tweens for entity
     */
    stopAllTweens(entityId) {
        this.removeIdleAnimation(entityId);

        // Remove any other tracked tweens
        for (const [key, tween] of this.activeTweens) {
            if (key.startsWith(entityId)) {
                tween.stop();
                this.activeTweens.delete(key);
            }
        }
    }

    /**
     * Clear all animations
     */
    clearAll() {
        for (const tween of this.idleAnimations.values()) {
            tween.stop();
        }
        this.idleAnimations.clear();

        for (const tween of this.activeTweens.values()) {
            tween.stop();
        }
        this.activeTweens.clear();
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.AnimationManager = AnimationManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}

import {
  Champion,
  Minion,
  Turret,
  Inhibitor,
  Nexus,
  Monster,
  TargetDummy,
  Projectile,
  FloatingText,
  ClickEffect,
  Team,
  UnitType,
  GameMode,
  TutorialObjective,
  Item
} from '../types/game';
import { CHAMPION_PRESETS, ITEMS, BUSHES, TUTORIAL_OBJECTIVES, MAP_WIDTH, MAP_HEIGHT } from './constants';
import { soundManager } from '../audio/soundManager';

export interface GameStateListener {
  onPlayerUpdate: (player: Champion) => void;
  onGameEvent: (event: string, detail?: string) => void;
  onTutorialProgress: (objectives: TutorialObjective[], currentStep: number) => void;
  onGameOver: (winner: Team, stats: { kills: number; deaths: number; cs: number; gold: number; time: string }) => void;
  onKillAnnouncement: (text: string, subtext?: string) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;

  // Game configuration
  public mode: GameMode = 'tutorial';
  public selectedChampionId: string = 'garen';
  private listener: GameStateListener;

  // Camera coordinates (top-left of viewport in map space)
  public cameraX: number = 0;
  public cameraY: number = 0;
  public viewportWidth: number = 1200;
  public viewportHeight: number = 800;
  public isCameraLocked: boolean = true;
  private screenShake: number = 0;

  // Entities
  public player!: Champion;
  public enemyChampion: Champion | null = null;
  public minions: Minion[] = [];
  public turrets: Turret[] = [];
  public inhibitors: Inhibitor[] = [];
  public nexuses: { blue: Nexus; red: Nexus } = {
    blue: { id: 'blue_nexus', team: 'blue', x: 450, y: 2550, radius: 65, hp: 4000, maxHp: 4000, isDead: false },
    red: { id: 'red_nexus', team: 'red', x: 2550, y: 450, radius: 65, hp: 4000, maxHp: 4000, isDead: false },
  };
  public monsters: Monster[] = [];
  public targetDummy: TargetDummy | null = null;
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];
  public clickEffects: ClickEffect[] = [];

  // Spawners & Timers
  private gameTime: number = 0; // seconds
  private minionWaveTimer: number = 5; // First wave in 5s
  private waveCount: number = 0;
  public blueKills: number = 0;
  public redKills: number = 0;
  public isGameOver: boolean = false;
  public winner: Team | null = null;

  // Mouse / Aiming & Attack-Move state
  public mouseMapX: number = 0;
  public mouseMapY: number = 0;
  public isAttackMoveMode: boolean = false;
  public isAttackMovingToTarget: boolean = false;
  public attackMoveDestination: { x: number; y: number } | null = null;
  public aimingSkill: 'Q' | 'W' | 'E' | 'R' | null = null;
  public selectedUnit: { id: string; type: UnitType; team: Team } | null = null;

  // Tutorial tracking
  public tutorialObjectives: TutorialObjective[] = JSON.parse(JSON.stringify(TUTORIAL_OBJECTIVES));
  public currentTutorialStep: number = 1;
  private distanceMovedInTutorial: number = 0;

  // Atmospheric wind particles
  private ambientParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

  // Images cache
  private championImages: Record<string, HTMLImageElement> = {};

  constructor(canvas: HTMLCanvasElement, listener: GameStateListener, mode: GameMode = 'tutorial', champId: string = 'garen') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.listener = listener;
    this.mode = mode;
    this.selectedChampionId = champId;

    this.loadImages();
    this.initAmbientParticles();
    this.initGame();
  }

  private initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 40; i++) {
      this.ambientParticles.push({
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        vx: 30 + Math.random() * 40,
        vy: 10 + Math.random() * 20,
        size: 3 + Math.random() * 4,
        alpha: 0.3 + Math.random() * 0.4,
      });
    }
  }

  private loadImages() {
    const garenImg = new Image();
    garenImg.src = '/src/assets/images/champion_garen_portrait_1793073874845.jpg';
    this.championImages['garen'] = garenImg;

    const ahriImg = new Image();
    ahriImg.src = '/src/assets/images/champion_ahri_portrait_1793073874831.jpg';
    this.championImages['ahri'] = ahriImg;

    const asheImg = new Image();
    asheImg.src = '/src/assets/images/champion_ashe_portrait_1793073874601.jpg';
    this.championImages['ashe'] = asheImg;
  }

  public initGame() {
    this.gameTime = 0;
    this.minionWaveTimer = this.mode === 'tutorial' ? 2 : 8;
    this.waveCount = 0;
    this.blueKills = 0;
    this.redKills = 0;
    this.isGameOver = false;
    this.winner = null;
    this.projectiles = [];
    this.floatingTexts = [];
    this.clickEffects = [];
    this.minions = [];
    this.tutorialObjectives = JSON.parse(JSON.stringify(TUTORIAL_OBJECTIVES));
    this.currentTutorialStep = 1;
    this.distanceMovedInTutorial = 0;
    this.isAttackMoveMode = false;
    this.isAttackMovingToTarget = false;
    this.attackMoveDestination = null;

    // Initialize Player Champion
    const preset = CHAMPION_PRESETS[this.selectedChampionId] || CHAMPION_PRESETS.garen;
    this.player = {
      ...JSON.parse(JSON.stringify(preset)),
      team: 'blue',
      x: 550,
      y: 2450,
      targetX: undefined,
      targetY: undefined,
      targetUnitId: null,
      targetUnitType: null,
    };

    // Initialize Enemy Champion (Bot)
    const enemyPresetId = this.selectedChampionId === 'garen' ? 'ahri' : 'garen';
    const enemyPreset = CHAMPION_PRESETS[enemyPresetId];
    this.enemyChampion = {
      ...JSON.parse(JSON.stringify(enemyPreset)),
      team: 'red',
      x: 2450,
      y: 550,
      targetX: undefined,
      targetY: undefined,
      targetUnitId: null,
      targetUnitType: null,
    };

    // Center camera on player
    this.cameraX = this.player.x - this.viewportWidth / 2;
    this.cameraY = this.player.y - this.viewportHeight / 2;
    this.clampCamera();

    // Initialize Turrets
    this.initTurrets();

    // Initialize Inhibitors & Nexuses
    this.inhibitors = [
      { id: 'blue_mid_inhib', team: 'blue', lane: 'mid', x: 750, y: 2250, radius: 45, hp: 3000, maxHp: 3000, isDead: false, respawnTimer: 0 },
      { id: 'red_mid_inhib', team: 'red', lane: 'mid', x: 2250, y: 750, radius: 45, hp: 3000, maxHp: 3000, isDead: false, respawnTimer: 0 },
    ];

    this.nexuses = {
      blue: { id: 'blue_nexus', team: 'blue', x: 450, y: 2550, radius: 65, hp: 4000, maxHp: 4000, isDead: false },
      red: { id: 'red_nexus', team: 'red', x: 2550, y: 450, radius: 65, hp: 4000, maxHp: 4000, isDead: false },
    };

    // Initialize Jungle Monsters
    this.initMonsters();

    // In Tutorial or Practice, spawn a Target Dummy in lane for safe practice
    if (this.mode === 'tutorial' || this.mode === 'practice') {
      this.targetDummy = {
        id: 'training_dummy',
        x: 1050,
        y: 1950,
        radius: 35,
        hp: 5000,
        maxHp: 5000,
        armor: 50,
        magicResist: 50,
        damageTaken: 0,
        dps: 0,
        lastDamageTime: 0,
      };
    } else {
      this.targetDummy = null;
    }

    this.notifyPlayerUpdate();
  }

  private initTurrets() {
    this.turrets = [
      // Blue Turrets (Mid lane)
      { id: 'blue_outer_mid', team: 'blue', lane: 'mid', tier: 'outer', x: 1250, y: 1750, radius: 46, range: 750, hp: 3500, maxHp: 3500, attackDamage: 160, attackCooldown: 0, maxAttackCooldown: 1.1, targetUnitId: null, targetUnitType: null, consecutiveShots: 0, isDead: false },
      { id: 'blue_inner_mid', team: 'blue', lane: 'mid', tier: 'inner', x: 950, y: 2050, radius: 46, range: 750, hp: 3800, maxHp: 3800, attackDamage: 190, attackCooldown: 0, maxAttackCooldown: 1.1, targetUnitId: null, targetUnitType: null, consecutiveShots: 0, isDead: false },
      { id: 'blue_nexus_turret_1', team: 'blue', lane: 'mid', tier: 'nexus1', x: 550, y: 2450, radius: 46, range: 750, hp: 3200, maxHp: 3200, attackDamage: 180, attackCooldown: 0, maxAttackCooldown: 1.1, targetUnitId: null, targetUnitType: null, consecutiveShots: 0, isDead: false },

      // Red Turrets (Mid lane)
      { id: 'red_outer_mid', team: 'red', lane: 'mid', tier: 'outer', x: 1750, y: 1250, radius: 46, range: 750, hp: 3500, maxHp: 3500, attackDamage: 160, attackCooldown: 0, maxAttackCooldown: 1.1, targetUnitId: null, targetUnitType: null, consecutiveShots: 0, isDead: false },
      { id: 'red_inner_mid', team: 'red', lane: 'mid', tier: 'inner', x: 2050, y: 950, radius: 46, range: 750, hp: 3800, maxHp: 3800, attackDamage: 190, attackCooldown: 0, maxAttackCooldown: 1.1, targetUnitId: null, targetUnitType: null, consecutiveShots: 0, isDead: false },
      { id: 'red_nexus_turret_1', team: 'red', lane: 'mid', tier: 'nexus1', x: 2450, y: 550, radius: 46, range: 750, hp: 3200, maxHp: 3200, attackDamage: 180, attackCooldown: 0, maxAttackCooldown: 1.1, targetUnitId: null, targetUnitType: null, consecutiveShots: 0, isDead: false },
    ];
  }

  private initMonsters() {
    this.monsters = [
      // Dragon in lower river pit
      {
        id: 'dragon',
        type: 'dragon',
        nameKr: '화염의 드래곤',
        x: 2150,
        y: 2050,
        spawnX: 2150,
        spawnY: 2050,
        radius: 50,
        hp: 4500,
        maxHp: 4500,
        attackDamage: 110,
        attackRange: 450,
        attackCooldown: 0,
        maxAttackCooldown: 1.3,
        speed: 180,
        targetUnitId: null,
        targetUnitType: null,
        goldValue: 300,
        expValue: 350,
        isDead: false,
        respawnTimer: 0,
        buffType: 'dragon',
      },
      // Baron Nashor in upper river pit
      {
        id: 'baron',
        type: 'baron',
        nameKr: '내셔 남작 (바론)',
        x: 850,
        y: 950,
        spawnX: 850,
        spawnY: 950,
        radius: 65,
        hp: 9000,
        maxHp: 9000,
        attackDamage: 180,
        attackRange: 500,
        attackCooldown: 0,
        maxAttackCooldown: 1.0,
        speed: 0,
        targetUnitId: null,
        targetUnitType: null,
        goldValue: 500,
        expValue: 600,
        isDead: false,
        respawnTimer: 0,
        buffType: 'baron',
      },
      // Blue Buff
      {
        id: 'blue_buff',
        type: 'blue_buff',
        nameKr: '푸른 파수꾼 (블루)',
        x: 800,
        y: 1900,
        spawnX: 800,
        spawnY: 1900,
        radius: 40,
        hp: 2000,
        maxHp: 2000,
        attackDamage: 75,
        attackRange: 150,
        attackCooldown: 0,
        maxAttackCooldown: 1.2,
        speed: 200,
        targetUnitId: null,
        targetUnitType: null,
        goldValue: 120,
        expValue: 180,
        isDead: false,
        respawnTimer: 0,
        buffType: 'blue',
      },
      // Red Buff
      {
        id: 'red_buff',
        type: 'red_buff',
        nameKr: '붉은 덩굴정령 (레드)',
        x: 2200,
        y: 1100,
        spawnX: 2200,
        spawnY: 1100,
        radius: 40,
        hp: 2000,
        maxHp: 2000,
        attackDamage: 85,
        attackRange: 150,
        attackCooldown: 0,
        maxAttackCooldown: 1.2,
        speed: 200,
        targetUnitId: null,
        targetUnitType: null,
        goldValue: 120,
        expValue: 180,
        isDead: false,
        respawnTimer: 0,
        buffType: 'red',
      },
    ];
  }

  public setDimensions(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.clampCamera();
  }

  public start() {
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ==========================================
  // UPDATE LOOP & LOGIC
  // ==========================================
  private update(dt: number) {
    if (this.isGameOver) return;

    this.gameTime += dt;

    // Update screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Minion wave spawning
    this.minionWaveTimer -= dt;
    if (this.minionWaveTimer <= 0) {
      this.spawnMinionWave();
      this.minionWaveTimer = 25; // waves every 25s
    }

    // Update Player & Enemy Champion
    this.updateChampion(this.player, dt, true);
    if (this.enemyChampion) {
      this.updateEnemyChampionAI(this.enemyChampion, dt);
      this.updateChampion(this.enemyChampion, dt, false);
    }

    // Update Minions (Aggro, Kiting, Pulling)
    this.updateMinions(dt);

    // Update Turrets
    this.updateTurrets(dt);

    // Update Jungle Monsters
    this.updateMonsters(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Floating Texts & Click effects
    this.updateVisualEffects(dt);

    // Update Ambient Wind Particles
    this.updateAmbientParticles(dt);

    // Attack-Move target acquisition
    if (this.isAttackMovingToTarget && !this.player.isDead) {
      this.checkAttackMoveScanning();
    }

    // Update Camera
    if (this.isCameraLocked && !this.player.isDead) {
      this.cameraX = this.player.x - this.viewportWidth / 2;
      this.cameraY = this.player.y - this.viewportHeight / 2;
      this.clampCamera();
    }

    // Check Victory/Defeat
    this.checkNexusConditions();
  }

  private updateAmbientParticles(dt: number) {
    for (const p of this.ambientParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x > MAP_WIDTH) p.x = 0;
      if (p.y > MAP_HEIGHT) p.y = 0;
    }
  }

  public clampCamera() {
    this.cameraX = Math.max(0, Math.min(MAP_WIDTH - this.viewportWidth, this.cameraX));
    this.cameraY = Math.max(0, Math.min(MAP_HEIGHT - this.viewportHeight, this.cameraY));
  }

  public toggleCameraLock(): boolean {
    this.isCameraLocked = !this.isCameraLocked;
    if (this.isCameraLocked) {
      this.snapCameraToPlayer();
    }
    return this.isCameraLocked;
  }

  public snapCameraToPlayer() {
    this.cameraX = this.player.x - this.viewportWidth / 2;
    this.cameraY = this.player.y - this.viewportHeight / 2;
    this.clampCamera();
  }

  // ==========================================
  // BUSH & AGGRO UTILITIES
  // ==========================================
  public isUnitInBush(unit: { x: number; y: number }): boolean {
    return BUSHES.some(
      (b) => unit.x >= b.x && unit.x <= b.x + b.width && unit.y >= b.y && unit.y <= b.y + b.height
    );
  }

  public callMinionAggro(attacker: Champion, victim: Champion) {
    // League mechanic: Attacking an enemy champion calls aggro from enemy minions within 550 units!
    const minionTeam = victim.team;
    const enemyMinions = this.minions.filter(
      (m) => m.team === minionTeam && !m.isDead && Math.hypot(m.x - attacker.x, m.y - attacker.y) <= 550
    );

    if (enemyMinions.length > 0) {
      enemyMinions.forEach((minion) => {
        minion.targetUnitId = attacker.id;
        minion.targetUnitType = 'champion';
        minion.aggroTargetId = attacker.id;
        minion.aggroTimer = 3.0; // 3 seconds of aggro
      });

      if (attacker === this.player) {
        this.addFloatingText(attacker.x, attacker.y - 45, '⚠️ 미니언 어그로!', '#f97316', 15);
      }
    }
  }

  // ==========================================
  // CHAMPION UPDATE
  // ==========================================
  private updateChampion(champ: Champion, dt: number, isPlayer: boolean) {
    // Respawn timer
    if (champ.isDead) {
      champ.respawnTimer -= dt;
      if (champ.respawnTimer <= 0) {
        champ.isDead = false;
        champ.stats.hp = champ.stats.maxHp;
        champ.stats.mana = champ.stats.maxMana;
        champ.x = champ.team === 'blue' ? 550 : 2450;
        champ.y = champ.team === 'blue' ? 2450 : 550;
        champ.targetX = undefined;
        champ.targetY = undefined;
        champ.targetUnitId = null;
        this.addFloatingText(champ.x, champ.y - 40, '부활했습니다!', '#38bdf8', 16);
        if (isPlayer) this.notifyPlayerUpdate();
      }
      return;
    }

    // HP & Mana Regeneration
    if (champ.stats.hp < champ.stats.maxHp) {
      const regen = (champ.stats.hpRegen * dt) + (champ.hasBaronBuff ? 15 * dt : 0);
      champ.stats.hp = Math.min(champ.stats.maxHp, champ.stats.hp + regen);
    }
    if (champ.stats.mana < champ.stats.maxMana) {
      const manaReg = (champ.stats.manaRegen * dt) + (champ.hasBlueBuff ? 20 * dt : 0);
      champ.stats.mana = Math.min(champ.stats.maxMana, champ.stats.mana + manaReg);
    }

    // Fountain Healing (Near Nexus)
    const nexus = champ.team === 'blue' ? this.nexuses.blue : this.nexuses.red;
    const distToFountain = Math.hypot(champ.x - nexus.x, champ.y - nexus.y);
    if (distToFountain < 300) {
      champ.stats.hp = Math.min(champ.stats.maxHp, champ.stats.hp + champ.stats.maxHp * 0.25 * dt);
      champ.stats.mana = Math.min(champ.stats.maxMana, champ.stats.mana + champ.stats.maxMana * 0.25 * dt);
    }

    // Recall Channeling
    if (champ.isRecalling) {
      champ.recallTimer -= dt;
      if (champ.recallTimer <= 0) {
        champ.isRecalling = false;
        champ.x = champ.team === 'blue' ? 500 : 2500;
        champ.y = champ.team === 'blue' ? 2500 : 500;
        champ.targetX = undefined;
        champ.targetY = undefined;
        champ.stats.hp = champ.stats.maxHp;
        champ.stats.mana = champ.stats.maxMana;
        soundManager.playGold();
        this.addFloatingText(champ.x, champ.y - 30, '귀환 완료!', '#60a5fa', 15);

        // Tutorial Step 6: Recall check
        if (isPlayer && this.currentTutorialStep === 6 && !this.tutorialObjectives[5].completed) {
          this.tutorialObjectives[5].currentCount = 1;
          this.checkTutorialCompletion();
        }
      }
    }

    // Cooldown timers
    (['Q', 'W', 'E', 'R'] as const).forEach((key) => {
      const skill = champ.skills[key];
      if (skill.cooldown > 0) {
        skill.cooldown = Math.max(0, skill.cooldown - dt);
      }
    });

    // Summoner spell cooldowns
    (['D', 'F'] as const).forEach((key) => {
      const spell = champ.summonerSpells[key];
      if (spell.cooldown > 0) {
        spell.cooldown = Math.max(0, spell.cooldown - dt);
      }
    });

    // Attack cooldown
    if (champ.attackCooldown > 0) {
      champ.attackCooldown = Math.max(0, champ.attackCooldown - dt);
    }

    // Status timers
    if (champ.isSpinning && champ.spinDuration !== undefined) {
      champ.spinDuration -= dt;
      // AoE damage tick while spinning (Garen E)
      if (Math.random() < 0.25) {
        this.applyGarenSpinDamage(champ);
      }
      if (champ.spinDuration <= 0) {
        champ.isSpinning = false;
      }
    }

    if (champ.speedBoostTimer && champ.speedBoostTimer > 0) {
      champ.speedBoostTimer -= dt;
      if (champ.speedBoostTimer <= 0) {
        champ.stats.moveSpeed = champ.baseStats.moveSpeed;
      }
    }

    if (champ.silencedTimer && champ.silencedTimer > 0) {
      champ.silencedTimer -= dt;
    }

    if (champ.stunTimer && champ.stunTimer > 0) {
      champ.stunTimer -= dt;
      return; // Cannot move or attack while stunned
    }

    if (champ.charmedTimer && champ.charmedTimer > 0) {
      champ.charmedTimer -= dt;
      // Walk harmlessly toward Ahri
      const target = champ.team === 'blue' ? this.enemyChampion : this.player;
      if (target) {
        const angle = Math.atan2(target.y - champ.y, target.x - champ.x);
        champ.x += Math.cos(angle) * 120 * dt;
        champ.y += Math.sin(angle) * 120 * dt;
      }
      return;
    }

    // Check Tutorial Step 4: Minion aggro dropped via Bush
    if (isPlayer && this.currentTutorialStep === 4 && !this.tutorialObjectives[3].completed) {
      if (this.isUnitInBush(champ)) {
        // Player entered bush! Did any minion lose aggro?
        const redMinionsNear = this.minions.filter(
          (m) => m.team === 'red' && Math.hypot(m.x - champ.x, m.y - champ.y) < 600
        );
        if (redMinionsNear.length > 0) {
          this.tutorialObjectives[3].currentCount = 1;
          this.checkTutorialCompletion();
        }
      }
    }

    // Target tracking & Auto-attack
    if (champ.targetUnitId) {
      const target = this.findUnitById(champ.targetUnitId, champ.targetUnitType);
      if (!target || target.isDead || target.team === champ.team) {
        champ.targetUnitId = null;
        champ.targetUnitType = null;
        // Resume attack move if active
        if (isPlayer && this.isAttackMovingToTarget && this.attackMoveDestination) {
          champ.targetX = this.attackMoveDestination.x;
          champ.targetY = this.attackMoveDestination.y;
        }
      } else {
        const dist = Math.hypot(target.x - champ.x, target.y - champ.y);
        const effectiveRange = champ.stats.attackRange + champ.radius + target.radius;

        if (dist <= effectiveRange) {
          // In range, stop walking and attack if off cooldown
          champ.targetX = undefined;
          champ.targetY = undefined;
          if (champ.attackCooldown <= 0) {
            this.executeBasicAttack(champ, target, isPlayer);
          }
        } else {
          // Walk towards target
          champ.targetX = target.x;
          champ.targetY = target.y;
        }
      }
    }

    // Movement execution
    if (champ.targetX !== undefined && champ.targetY !== undefined) {
      const dx = champ.targetX - champ.x;
      const dy = champ.targetY - champ.y;
      const dist = Math.hypot(dx, dy);
      const step = champ.stats.moveSpeed * dt;

      if (dist <= step) {
        const moved = dist;
        champ.x = champ.targetX;
        champ.y = champ.targetY;
        champ.targetX = undefined;
        champ.targetY = undefined;
        if (isPlayer) {
          this.trackPlayerMovement(moved);
          if (this.isAttackMovingToTarget) {
            this.isAttackMovingToTarget = false;
            this.attackMoveDestination = null;
          }
        }
      } else {
        champ.x += (dx / dist) * step;
        champ.y += (dy / dist) * step;
        if (isPlayer) {
          this.trackPlayerMovement(step);
        }
      }

      // Interrupt recall if moved
      if (champ.isRecalling) {
        champ.isRecalling = false;
        this.addFloatingText(champ.x, champ.y - 30, '귀환 취소됨', '#f87171', 13);
      }
    }

    if (isPlayer) {
      this.notifyPlayerUpdate();
    }
  }

  // ==========================================
  // ATTACK-MOVE SCANNING (A-Click)
  // ==========================================
  private checkAttackMoveScanning() {
    if (this.player.targetUnitId) return;

    // Scan for nearest enemy in attack range + 180
    const scanRange = this.player.stats.attackRange + 180;
    const enemies = this.getEnemiesOfTeam(this.player.team);

    let closest: any = null;
    let minDist = scanRange;

    for (const enemy of enemies) {
      const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (d < minDist) {
        minDist = d;
        closest = enemy;
      }
    }

    if (closest) {
      this.player.targetUnitId = closest.id;
      this.player.targetUnitType = closest.type || 'minion';
      this.player.targetX = undefined;
      this.player.targetY = undefined;
    }
  }

  // ==========================================
  // ENEMY BOT AI
  // ==========================================
  private updateEnemyChampionAI(bot: Champion, dt: number) {
    if (bot.isDead) return;

    // Level up bot skills automatically
    if (bot.skillPoints > 0) {
      const keys: ('Q' | 'W' | 'E' | 'R')[] = ['Q', 'W', 'E', 'R'];
      const chosen = keys[Math.floor(Math.random() * keys.length)];
      if (bot.skills[chosen].level < bot.skills[chosen].maxLevel) {
        bot.skills[chosen].level++;
        bot.skillPoints--;
      }
    }

    const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);

    // Defensive Flash: Low HP (< 22%) and player is nearby
    if (bot.stats.hp < bot.stats.maxHp * 0.22 && bot.summonerSpells.D.cooldown <= 0 && distToPlayer < 450) {
      bot.summonerSpells.D.cooldown = bot.summonerSpells.D.maxCooldown;
      soundManager.playFlash();
      const retreatAngle = Math.atan2(550 - bot.y, 2450 - bot.x); // Toward base
      bot.x += Math.cos(retreatAngle) * 400;
      bot.y += Math.sin(retreatAngle) * 400;
      this.addFloatingText(bot.x, bot.y - 35, '적 봇 점멸 사용!', '#ef4444', 16);
      bot.targetX = 2300;
      bot.targetY = 700;
      bot.targetUnitId = null;
      return;
    }

    // Offensive Ignite: Player is low (< 30%)
    if (this.player.stats.hp < this.player.stats.maxHp * 0.3 && bot.summonerSpells.F.cooldown <= 0 && distToPlayer < 500) {
      bot.summonerSpells.F.cooldown = bot.summonerSpells.F.maxCooldown;
      soundManager.playSkill('garen', 'Q');
      this.addFloatingText(this.player.x, this.player.y - 40, '적 봇 점화 시전!', '#ef4444', 16);
      let ticks = 0;
      const interval = setInterval(() => {
        ticks++;
        this.applyDamage(this.player, 30, 'true', bot.id, 'champion', bot.team);
        if (ticks >= 5 || this.player.isDead) clearInterval(interval);
      }, 1000);
    }

    // Critical low HP retreat to tower
    if (bot.stats.hp < bot.stats.maxHp * 0.25) {
      bot.targetX = 2100;
      bot.targetY = 900;
      bot.targetUnitId = null;
      return;
    }

    // Engage Player if within range
    if (distToPlayer < 650 && !this.player.isDead) {
      bot.targetUnitId = this.player.id;
      bot.targetUnitType = 'champion';

      if (bot.skills.Q.cooldown <= 0 && bot.skills.Q.level > 0) {
        this.castSkill(bot, 'Q', this.player.x, this.player.y);
      } else if (bot.skills.W.cooldown <= 0 && bot.skills.W.level > 0 && distToPlayer < 400) {
        this.castSkill(bot, 'W', this.player.x, this.player.y);
      } else if (bot.skills.E.cooldown <= 0 && bot.skills.E.level > 0 && distToPlayer < 500) {
        this.castSkill(bot, 'E', this.player.x, this.player.y);
      } else if (bot.skills.R.cooldown <= 0 && bot.skills.R.level > 0 && this.player.stats.hp < this.player.stats.maxHp * 0.45) {
        this.castSkill(bot, 'R', this.player.x, this.player.y);
      }
    } else {
      // Farm blue minions in lane
      const blueMinions = this.minions.filter((m) => m.team === 'blue' && !m.isDead);
      if (blueMinions.length > 0) {
        let closest = blueMinions[0];
        let minDist = 99999;
        blueMinions.forEach((m) => {
          const d = Math.hypot(m.x - bot.x, m.y - bot.y);
          if (d < minDist) {
            minDist = d;
            closest = m;
          }
        });
        bot.targetUnitId = closest.id;
        bot.targetUnitType = 'minion';
      } else {
        bot.targetX = 1800;
        bot.targetY = 1200;
      }
    }
  }

  // ==========================================
  // MINION WAVE SPAWNER & PATHING
  // ==========================================
  private spawnMinionWave() {
    this.waveCount++;
    const isCannonWave = this.waveCount % 3 === 0;

    // Blue Team Wave
    for (let i = 0; i < 3; i++) {
      this.minions.push(this.createMinion('blue', 'melee', 420 + i * 25, 2580 - i * 25));
    }
    if (isCannonWave) {
      this.minions.push(this.createMinion('blue', 'cannon', 390, 2610));
    }
    for (let i = 0; i < 3; i++) {
      this.minions.push(this.createMinion('blue', 'caster', 360 + i * 25, 2640 - i * 25));
    }

    // Red Team Wave
    for (let i = 0; i < 3; i++) {
      this.minions.push(this.createMinion('red', 'melee', 2580 - i * 25, 420 + i * 25));
    }
    if (isCannonWave) {
      this.minions.push(this.createMinion('red', 'cannon', 2610, 390));
    }
    for (let i = 0; i < 3; i++) {
      this.minions.push(this.createMinion('red', 'caster', 2640 - i * 25, 360 + i * 25));
    }
  }

  private createMinion(team: Team, type: 'melee' | 'caster' | 'cannon', x: number, y: number): Minion {
    const isMelee = type === 'melee';
    const isCannon = type === 'cannon';
    return {
      id: `minion_${team}_${type}_${Math.random().toString(36).substring(2, 7)}`,
      team,
      lane: 'mid',
      type,
      x,
      y,
      radius: isCannon ? 20 : isMelee ? 18 : 16,
      hp: isCannon ? 850 : isMelee ? 480 : 290,
      maxHp: isCannon ? 850 : isMelee ? 480 : 290,
      attackDamage: isCannon ? 40 : isMelee ? 24 : 32,
      attackRange: isMelee ? 110 : 450,
      attackCooldown: 0,
      maxAttackCooldown: 1.25,
      speed: 240,
      targetUnitId: null,
      targetUnitType: null,
      goldValue: isCannon ? 60 : isMelee ? 21 : 14,
      expValue: isCannon ? 90 : isMelee ? 60 : 35,
      waypointIndex: 0,
      isDead: false,
    };
  }

  // ==========================================
  // MINIONS AI, AGGRO, KITING & BUSH DROP
  // ==========================================
  private updateMinions(dt: number) {
    this.minions = this.minions.filter((m) => !m.isDead);

    this.minions.forEach((minion) => {
      if (minion.attackCooldown > 0) {
        minion.attackCooldown -= dt;
      }

      // Aggro timer countdown
      if (minion.aggroTimer && minion.aggroTimer > 0) {
        minion.aggroTimer -= dt;
        if (minion.aggroTimer <= 0) {
          minion.aggroTargetId = null;
          minion.targetUnitId = null;
        }
      }

      // Check Bush Aggro Dropping (부쉬 풀링)
      if (minion.aggroTargetId) {
        const targetedChamp = minion.aggroTargetId === this.player.id ? this.player : this.enemyChampion;
        if (targetedChamp) {
          // If champion entered a bush and minion is NOT in the same bush, drop aggro immediately!
          const champInBush = this.isUnitInBush(targetedChamp);
          const minionInBush = this.isUnitInBush(minion);
          const distToChamp = Math.hypot(targetedChamp.x - minion.x, targetedChamp.y - minion.y);

          if ((champInBush && !minionInBush) || distToChamp > 650) {
            minion.aggroTargetId = null;
            minion.targetUnitId = null;
            minion.targetUnitType = null;
          }
        }
      }

      // Check current target validity
      let target: any = null;
      if (minion.targetUnitId) {
        target = this.findUnitById(minion.targetUnitId, minion.targetUnitType);
        if (!target || target.isDead || target.team === minion.team) {
          minion.targetUnitId = null;
          minion.targetUnitType = null;
          target = null;
        }
      }

      // Minion wave pulling by approaching player
      if (!target && !minion.aggroTargetId) {
        const opposingChamp = minion.team === 'blue' ? this.enemyChampion : this.player;
        if (opposingChamp && !opposingChamp.isDead && !this.isUnitInBush(opposingChamp)) {
          const d = Math.hypot(opposingChamp.x - minion.x, opposingChamp.y - minion.y);
          if (d <= 320) {
            minion.targetUnitId = opposingChamp.id;
            minion.targetUnitType = 'champion';
            target = opposingChamp;
          }
        }
      }

      // If still no target, scan for nearby enemies within 500 units
      if (!target) {
        const enemies = this.getEnemiesOfTeam(minion.team);
        let closestDist = 500;
        let bestTarget: any = null;

        enemies.forEach((enemy) => {
          const d = Math.hypot(enemy.x - minion.x, enemy.y - minion.y);
          if (d < closestDist) {
            closestDist = d;
            bestTarget = enemy;
          }
        });

        if (bestTarget) {
          minion.targetUnitId = bestTarget.id;
          minion.targetUnitType = bestTarget.type || (bestTarget === this.player || bestTarget === this.enemyChampion ? 'champion' : 'minion');
          target = bestTarget;
        }
      }

      if (target) {
        const dist = Math.hypot(target.x - minion.x, target.y - minion.y);
        const range = minion.attackRange + minion.radius + target.radius;

        if (dist <= range) {
          // Attack target
          if (minion.attackCooldown <= 0) {
            minion.attackCooldown = minion.maxAttackCooldown;
            if (minion.type === 'melee') {
              this.applyDamage(target, minion.attackDamage, 'physical', minion.id, 'minion', minion.team);
            } else {
              // Ranged projectile
              this.projectiles.push({
                id: `minion_proj_${Math.random()}`,
                ownerId: minion.id,
                ownerType: 'minion',
                ownerTeam: minion.team,
                targetId: target.id,
                targetType: minion.targetUnitType || 'minion',
                x: minion.x,
                y: minion.y,
                startX: minion.x,
                startY: minion.y,
                vx: 0,
                vy: 0,
                speed: 650,
                damage: minion.attackDamage,
                damageType: 'magic',
                color: minion.team === 'blue' ? '#38bdf8' : '#f87171',
                size: 4,
                isSkillshot: false,
              });
            }
          }
        } else {
          // Walk toward target
          const angle = Math.atan2(target.y - minion.y, target.x - minion.x);
          minion.x += Math.cos(angle) * minion.speed * dt;
          minion.y += Math.sin(angle) * minion.speed * dt;
        }
      } else {
        // March along mid lane toward enemy nexus!
        const dest = minion.team === 'blue' ? this.nexuses.red : this.nexuses.blue;
        const angle = Math.atan2(dest.y - minion.y, dest.x - minion.x);
        minion.x += Math.cos(angle) * minion.speed * dt;
        minion.y += Math.sin(angle) * minion.speed * dt;
      }
    });
  }

  // ==========================================
  // TURRETS AI & TARGETING
  // ==========================================
  private updateTurrets(dt: number) {
    this.turrets.forEach((turret) => {
      if (turret.isDead) return;

      if (turret.attackCooldown > 0) {
        turret.attackCooldown -= dt;
      }

      // Check current target
      let target: any = null;
      if (turret.targetUnitId) {
        target = this.findUnitById(turret.targetUnitId, turret.targetUnitType);
        if (!target || target.isDead || Math.hypot(target.x - turret.x, target.y - turret.y) > turret.range) {
          turret.targetUnitId = null;
          turret.targetUnitType = null;
          turret.consecutiveShots = 0;
          target = null;
        }
      }

      // Acquire target if none
      if (!target) {
        const enemyMinions = this.minions.filter((m) => m.team !== turret.team && !m.isDead && Math.hypot(m.x - turret.x, m.y - turret.y) <= turret.range);
        const enemyChamps = [this.player, this.enemyChampion].filter((c) => c && c.team !== turret.team && !c.isDead && Math.hypot(c.x - turret.x, c.y - turret.y) <= turret.range) as Champion[];

        // Priority: 1. Minions, 2. Champions
        if (enemyMinions.length > 0) {
          target = enemyMinions[0];
          turret.targetUnitId = target.id;
          turret.targetUnitType = 'minion';
        } else if (enemyChamps.length > 0) {
          target = enemyChamps[0];
          turret.targetUnitId = target.id;
          turret.targetUnitType = 'champion';
          if (target === this.player) {
            soundManager.playTurretWarning();
          }
        }
      }

      // Fire at target
      if (target && turret.attackCooldown <= 0) {
        turret.attackCooldown = turret.maxAttackCooldown;
        turret.consecutiveShots++;
        const multiplier = target === this.player || target === this.enemyChampion ? 1 + (turret.consecutiveShots - 1) * 0.35 : 1.0;
        const damage = turret.attackDamage * multiplier;

        soundManager.playTurretShot();

        this.projectiles.push({
          id: `turret_shot_${Math.random()}`,
          ownerId: turret.id,
          ownerType: 'turret',
          ownerTeam: turret.team,
          targetId: target.id,
          targetType: turret.targetUnitType || 'minion',
          x: turret.x,
          y: turret.y,
          startX: turret.x,
          startY: turret.y,
          vx: 0,
          vy: 0,
          speed: 800,
          damage,
          damageType: 'true',
          color: turret.team === 'blue' ? '#00e5ff' : '#ff1744',
          size: 9,
          isSkillshot: false,
        });
      }

      // Tutorial Step 5: Step inside enemy turret range with minion wave
      if (this.currentTutorialStep === 5 && turret.team === 'red' && turret.tier === 'outer') {
        const distToPlayer = Math.hypot(this.player.x - turret.x, this.player.y - turret.y);
        const blueMinionsUnderTower = this.minions.filter((m) => m.team === 'blue' && !m.isDead && Math.hypot(m.x - turret.x, m.y - turret.y) <= turret.range);
        if (distToPlayer <= turret.range && blueMinionsUnderTower.length >= 1) {
          this.tutorialObjectives[4].currentCount = 1;
          this.checkTutorialCompletion();
        }
      }
    });
  }

  // ==========================================
  // JUNGLE MONSTERS
  // ==========================================
  private updateMonsters(dt: number) {
    this.monsters.forEach((monster) => {
      if (monster.isDead) {
        monster.respawnTimer -= dt;
        if (monster.respawnTimer <= 0) {
          monster.isDead = false;
          monster.hp = monster.maxHp;
          monster.x = monster.spawnX;
          monster.y = monster.spawnY;
        }
        return;
      }

      if (monster.attackCooldown > 0) {
        monster.attackCooldown -= dt;
      }

      // Check current target
      let target: any = null;
      if (monster.targetUnitId) {
        target = this.findUnitById(monster.targetUnitId, monster.targetUnitType);
        const dist = target ? Math.hypot(target.x - monster.spawnX, target.y - monster.spawnY) : 9999;
        if (!target || target.isDead || dist > 700) {
          // Leash back to spawn
          monster.targetUnitId = null;
          monster.targetUnitType = null;
          monster.x = monster.spawnX;
          monster.y = monster.spawnY;
          monster.hp = monster.maxHp; // Reset HP
          target = null;
        }
      }

      if (target && monster.attackCooldown <= 0) {
        const dist = Math.hypot(target.x - monster.x, target.y - monster.y);
        if (dist <= monster.attackRange + monster.radius + target.radius) {
          monster.attackCooldown = monster.maxAttackCooldown;
          this.applyDamage(target, monster.attackDamage, 'physical', monster.id, 'monster', 'neutral');
        } else if (monster.speed > 0) {
          const angle = Math.atan2(target.y - monster.y, target.x - monster.x);
          monster.x += Math.cos(angle) * monster.speed * dt;
          monster.y += Math.sin(angle) * monster.speed * dt;
        }
      }
    });
  }

  // ==========================================
  // PROJECTILES
  // ==========================================
  private updateProjectiles(dt: number) {
    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isSkillshot) {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        const distFromStart = Math.hypot(proj.x - proj.startX, proj.y - proj.startY);

        // Returning skillshot (Ahri Q)
        if (proj.onHitEffect === 'return' && proj.maxDistance && distFromStart >= proj.maxDistance && !proj.isReturning) {
          proj.isReturning = true;
          proj.damageType = 'true';
          proj.color = '#ffffff';
        }

        if (proj.isReturning) {
          const owner = proj.ownerType === 'champion' ? (proj.ownerTeam === 'blue' ? this.player : this.enemyChampion) : null;
          if (owner) {
            const angle = Math.atan2(owner.y - proj.y, owner.x - proj.x);
            proj.vx = Math.cos(angle) * proj.speed;
            proj.vy = Math.sin(angle) * proj.speed;

            if (Math.hypot(owner.x - proj.x, owner.y - proj.y) < 30) {
              return false; // Reached owner, delete
            }
          }
        }

        // Collision detection with enemies
        const enemies = this.getEnemiesOfTeam(proj.ownerTeam);
        for (const enemy of enemies) {
          if (proj.hitUnitIds?.includes(enemy.id)) continue;

          const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
          if (dist <= proj.size + enemy.radius) {
            // Hit!
            this.applyDamage(enemy, proj.damage, proj.damageType, proj.ownerId, proj.ownerType, proj.ownerTeam);
            if (!proj.hitUnitIds) proj.hitUnitIds = [];
            proj.hitUnitIds.push(enemy.id);

            // Apply special effects
            if (proj.onHitEffect === 'knockup') {
              if (enemy === this.enemyChampion || enemy === this.player) {
                enemy.airborneTimer = 1.5;
                enemy.stunTimer = 1.5;
                this.addFloatingText(enemy.x, enemy.y - 45, '에어본!', '#38bdf8', 18);
                this.screenShake = 10;
              }
            } else if (proj.onHitEffect === 'charm' && enemy === this.enemyChampion) {
              enemy.charmedTimer = 1.5;
              this.addFloatingText(enemy.x, enemy.y - 40, '매혹!', '#f472b6', 16);
            } else if (proj.onHitEffect === 'stun') {
              if (enemy === this.enemyChampion || enemy === this.player) {
                enemy.stunTimer = 2.0;
                this.addFloatingText(enemy.x, enemy.y - 40, '속박/기절!', '#fef08a', 16);
                this.screenShake = 8;
              }
            } else if (proj.onHitEffect === 'slow') {
              if (enemy.stats) {
                enemy.stats.moveSpeed *= 0.65;
                setTimeout(() => {
                  if (enemy.stats) enemy.stats.moveSpeed = enemy.baseStats.moveSpeed;
                }, 2000);
              }
            }

            if (!proj.pierce && !proj.isReturning) {
              return false;
            }
          }
        }

        if (proj.maxDistance && distFromStart > proj.maxDistance && !proj.isReturning) {
          return false;
        }

        return true;
      } else {
        // Homing projectile toward target
        const target = this.findUnitById(proj.targetId, proj.targetType);
        if (!target || target.isDead) return false;

        const dx = target.x - proj.x;
        const dy = target.y - proj.y;
        const dist = Math.hypot(dx, dy);
        const step = proj.speed * dt;

        if (dist <= step) {
          this.applyDamage(target, proj.damage, proj.damageType, proj.ownerId, proj.ownerType, proj.ownerTeam);
          return false;
        } else {
          proj.x += (dx / dist) * step;
          proj.y += (dy / dist) * step;
          return true;
        }
      }
    });
  }

  // Floating text & visual effects
  private updateVisualEffects(dt: number) {
    this.floatingTexts = this.floatingTexts.filter((t) => {
      t.elapsed += dt;
      t.y -= 25 * dt;
      t.opacity = Math.max(0, 1 - t.elapsed / t.duration);
      return t.elapsed < t.duration;
    });

    this.clickEffects = this.clickEffects.filter((c) => {
      c.radius += 50 * dt;
      c.opacity = Math.max(0, 1 - c.radius / c.maxRadius);
      return c.radius < c.maxRadius;
    });
  }

  // ==========================================
  // COMBAT & DAMAGE CALCULATIONS
  // ==========================================
  private executeBasicAttack(champ: Champion, target: any, isPlayer: boolean) {
    champ.attackCooldown = 1 / champ.stats.attackSpeed;
    const isRanged = champ.stats.attackRange > 300;

    soundManager.playAttack(isRanged);

    // Call minion aggro if champion attacks enemy champion!
    if (target === this.enemyChampion || target === this.player) {
      this.callMinionAggro(champ, target);
    }

    // Crit check
    const isCrit = Math.random() * 100 < champ.stats.critChance;
    let damage = champ.stats.attackDamage * (isCrit ? 1.75 : 1.0);

    // Garen Q empowered attack
    if (champ.id === 'garen' && champ.speedBoostTimer && champ.speedBoostTimer > 0) {
      damage += 70 + champ.stats.attackDamage * 0.5;
      champ.speedBoostTimer = 0;
      champ.stats.moveSpeed = champ.baseStats.moveSpeed;
      if (target === this.enemyChampion || target === this.player) {
        target.silencedTimer = 1.5;
        this.addFloatingText(target.x, target.y - 45, '침묵!', '#a855f7', 16);
      }
    }

    if (isRanged) {
      this.projectiles.push({
        id: `auto_proj_${Math.random()}`,
        ownerId: champ.id,
        ownerType: 'champion',
        ownerTeam: champ.team,
        targetId: target.id,
        targetType: champ.targetUnitType || 'minion',
        x: champ.x,
        y: champ.y,
        startX: champ.x,
        startY: champ.y,
        vx: 0,
        vy: 0,
        speed: 950,
        damage,
        damageType: 'physical',
        color: champ.id === 'ashe' ? '#38bdf8' : '#e0e7ff',
        size: 5,
        isSkillshot: false,
      });
    } else {
      this.applyDamage(target, damage, 'physical', champ.id, 'champion', champ.team, isCrit);
    }
  }

  private applyGarenSpinDamage(garen: Champion) {
    const enemies = this.getEnemiesOfTeam(garen.team);
    enemies.forEach((enemy) => {
      const d = Math.hypot(enemy.x - garen.x, enemy.y - garen.y);
      if (d <= 325) {
        const damage = 35 + garen.stats.attackDamage * 0.15;
        this.applyDamage(enemy, damage, 'physical', garen.id, 'champion', garen.team);
      }
    });
  }

  public applyDamage(
    target: any,
    rawDamage: number,
    damageType: 'physical' | 'magic' | 'true',
    attackerId: string,
    attackerType: UnitType,
    attackerTeam: Team,
    isCrit: boolean = false
  ) {
    if (!target || target.isDead) return;

    let armor = target.armor || target.stats?.armor || 0;
    let mr = target.magicResist || target.stats?.magicResist || 0;
    let finalDamage = rawDamage;

    if (damageType === 'physical') {
      finalDamage = rawDamage * (100 / (100 + armor));
    } else if (damageType === 'magic') {
      finalDamage = rawDamage * (100 / (100 + mr));
    }

    // Shield absorption
    if (target.shield && target.shield > 0) {
      if (target.shield >= finalDamage) {
        target.shield -= finalDamage;
        this.addFloatingText(target.x, target.y - 25, `-${Math.round(finalDamage)} (보호막)`, '#93c5fd', 13);
        return;
      } else {
        finalDamage -= target.shield;
        target.shield = 0;
      }
    }

    if (target.stats) {
      target.stats.hp = Math.max(0, target.stats.hp - finalDamage);
    } else {
      target.hp = Math.max(0, target.hp - finalDamage);
    }

    // Floating text
    const color = damageType === 'true' ? '#ffffff' : isCrit ? '#fbbf24' : damageType === 'magic' ? '#c084fc' : '#f87171';
    this.addFloatingText(target.x, target.y - 20, `${isCrit ? '💥 ' : ''}-${Math.round(finalDamage)}`, color, isCrit ? 18 : 14, false, isCrit);

    // Target Dummy tracking
    if (this.targetDummy && target === this.targetDummy) {
      this.targetDummy.damageTaken += finalDamage;
      this.targetDummy.lastDamageTime = performance.now();
      if (this.currentTutorialStep === 2 && !this.tutorialObjectives[1].completed && attackerId === this.player.id) {
        this.tutorialObjectives[1].currentCount = 1;
        this.checkTutorialCompletion();
      }
    }

    // Unit Death Check
    const currentHp = target.stats ? target.stats.hp : target.hp;
    if (currentHp <= 0) {
      this.handleUnitDeath(target, attackerId, attackerType, attackerTeam);
    }
  }

  private handleUnitDeath(target: any, killerId: string, killerType: UnitType, killerTeam: Team) {
    target.isDead = true;

    const isPlayerKiller = killerId === this.player.id;

    if (target === this.enemyChampion || target === this.player) {
      target.respawnTimer = Math.min(60, 10 + target.level * 2);
      if (target === this.enemyChampion) {
        this.blueKills++;
        this.player.kills++;
        this.player.gold += 300;
        this.awardExp(this.player, 400);
        soundManager.playAnnouncer(this.blueKills === 1 ? 'firstBlood' : 'kill');
        this.listener.onKillAnnouncement('적을 처치했습니다!', '+300 골드');
        this.addFloatingText(target.x, target.y - 30, '+300G', '#eab308', 18, true);

        // Tutorial Step 7: defeat bot
        if (this.currentTutorialStep === 7) {
          this.tutorialObjectives[6].currentCount = 1;
          this.checkTutorialCompletion();
        }
      } else {
        this.redKills++;
        this.player.deaths++;
        soundManager.playAnnouncer('defeat');
        this.listener.onKillAnnouncement('처치당했습니다...', '부활 대기 중');
      }
    } else if (target.type === 'minion' || target.goldValue) {
      if (isPlayerKiller) {
        this.player.cs++;
        this.player.gold += target.goldValue;
        soundManager.playGold();
        this.addFloatingText(target.x, target.y - 20, `+${target.goldValue}G`, '#eab308', 16, true);

        // Tutorial Step 3: Last hit 3 minions
        if (this.currentTutorialStep === 3 && target.type) {
          this.tutorialObjectives[2].currentCount++;
          if (this.tutorialObjectives[2].currentCount >= 3) {
            this.checkTutorialCompletion();
          }
          this.listener.onTutorialProgress(this.tutorialObjectives, this.currentTutorialStep);
        }
      }

      // Exp awarded
      const distToPlayer = Math.hypot(this.player.x - target.x, this.player.y - target.y);
      if (distToPlayer < 900) {
        this.awardExp(this.player, target.expValue);
      }
      if (this.enemyChampion && Math.hypot(this.enemyChampion.x - target.x, this.enemyChampion.y - target.y) < 900) {
        this.awardExp(this.enemyChampion, target.expValue);
      }

      // Monster Buffs
      if (target.buffType && isPlayerKiller) {
        if (target.buffType === 'baron') {
          this.player.hasBaronBuff = true;
          this.addFloatingText(this.player.x, this.player.y - 40, '바론 버프 획득!', '#a855f7', 18);
          this.listener.onKillAnnouncement('내셔 남작을 처치했습니다!', '아군 전체 능력치 강화');
        } else if (target.buffType === 'dragon') {
          this.player.hasDragonBuff = true;
          this.addFloatingText(this.player.x, this.player.y - 40, '드래곤 버프 획득!', '#f97316', 18);
          this.listener.onKillAnnouncement('드래곤을 처치했습니다!', '영구 공격력 & 주문력 증가');
        } else if (target.buffType === 'blue') {
          this.player.hasBlueBuff = true;
          this.addFloatingText(this.player.x, this.player.y - 40, '블루 버프 획득!', '#38bdf8', 16);
        } else if (target.buffType === 'red') {
          this.player.hasRedBuff = true;
          this.addFloatingText(this.player.x, this.player.y - 40, '레드 버프 획득!', '#ef4444', 16);
        }
      }
    } else if (target.tier) {
      soundManager.playAnnouncer('turretDestroyed');
      this.screenShake = 12;
      this.listener.onKillAnnouncement(target.team === 'red' ? '적 포탑을 파괴했습니다!' : '아군 포탑이 파괴되었습니다!', '+250 골드');
      if (target.team === 'red') {
        this.player.gold += 250;
        this.addFloatingText(target.x, target.y - 40, '포탑 파괴! +250G', '#eab308', 20, true);
      }
    }

    this.notifyPlayerUpdate();
  }

  private awardExp(champ: Champion, exp: number) {
    champ.exp += exp;
    this.addFloatingText(champ.x + 15, champ.y - 30, `+${exp} EXP`, '#38bdf8', 13);

    while (champ.exp >= champ.maxExp && champ.level < 18) {
      champ.exp -= champ.maxExp;
      champ.level++;
      champ.skillPoints++;
      champ.maxExp = Math.round(champ.maxExp * 1.35);

      champ.stats.maxHp += 85;
      champ.stats.hp = Math.min(champ.stats.maxHp, champ.stats.hp + 85);
      champ.stats.attackDamage += 3.5;
      champ.stats.armor += 3.0;
      champ.stats.magicResist += 1.5;

      soundManager.playLevelUp();
      this.addFloatingText(champ.x, champ.y - 50, `레벨 업! (Lv.${champ.level})`, '#eab308', 20, true);
    }
  }

  private checkNexusConditions() {
    if (this.nexuses.red.hp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.winner = 'blue';
      soundManager.playAnnouncer('victory');
      this.listener.onGameOver('blue', {
        kills: this.player.kills,
        deaths: this.player.deaths,
        cs: this.player.cs,
        gold: this.player.gold,
        time: this.formatGameTime(),
      });
    } else if (this.nexuses.blue.hp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.winner = 'red';
      soundManager.playAnnouncer('defeat');
      this.listener.onGameOver('red', {
        kills: this.player.kills,
        deaths: this.player.deaths,
        cs: this.player.cs,
        gold: this.player.gold,
        time: this.formatGameTime(),
      });
    }
  }

  // ==========================================
  // SKILL & SPELL CASTING
  // ==========================================
  public castSkill(champ: Champion, key: 'Q' | 'W' | 'E' | 'R', targetX?: number, targetY?: number) {
    if (champ.isDead || champ.stunTimer) return;
    const skill = champ.skills[key];
    if (skill.level === 0 || skill.cooldown > 0) return;
    if (champ.stats.mana < skill.manaCost) {
      if (champ === this.player) this.addFloatingText(champ.x, champ.y - 30, '마나가 부족합니다!', '#94a3b8', 13);
      return;
    }

    champ.stats.mana -= skill.manaCost;
    skill.cooldown = skill.maxCooldown;

    soundManager.playSkill(champ.id, key);

    const tx = targetX ?? this.mouseMapX;
    const ty = targetY ?? this.mouseMapY;

    if (champ.id === 'garen') {
      if (key === 'Q') {
        champ.speedBoostTimer = 3.5;
        champ.stats.moveSpeed = champ.baseStats.moveSpeed * 1.35;
        this.addFloatingText(champ.x, champ.y - 35, '결정타 준비!', '#f59e0b', 15);
      } else if (key === 'W') {
        champ.shield = 140 + champ.stats.maxHp * 0.15;
        this.addFloatingText(champ.x, champ.y - 35, '용기 발동! (보호막)', '#fbbf24', 15);
      } else if (key === 'E') {
        champ.isSpinning = true;
        champ.spinDuration = 3.0;
        this.addFloatingText(champ.x, champ.y - 35, '심판 회전!', '#e11d48', 15);
      } else if (key === 'R') {
        const target = this.findEnemyNear(tx, ty, champ.team);
        if (target) {
          const missingHp = target.stats ? target.stats.maxHp - target.stats.hp : target.maxHp - target.hp;
          const damage = 150 + missingHp * 0.3;
          this.applyDamage(target, damage, 'true', champ.id, 'champion', champ.team, true);
          this.screenShake = 15;
          this.addFloatingText(target.x, target.y - 50, '데마시아의 정의!', '#f59e0b', 22, false, true);
        }
      }
    } else if (champ.id === 'ahri') {
      if (key === 'Q') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `ahri_q_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 750,
          vy: Math.sin(angle) * 750,
          speed: 750,
          damage: 65 + champ.stats.abilityPower * 0.45,
          damageType: 'magic',
          color: '#38bdf8',
          size: 16,
          isSkillshot: true,
          maxDistance: 650,
          pierce: true,
          onHitEffect: 'return',
        });
      } else if (key === 'W') {
        champ.stats.moveSpeed = champ.baseStats.moveSpeed * 1.4;
        setTimeout(() => {
          champ.stats.moveSpeed = champ.baseStats.moveSpeed;
        }, 2000);
        const enemies = this.getEnemiesOfTeam(champ.team);
        enemies.slice(0, 3).forEach((enemy) => {
          this.projectiles.push({
            id: `ahri_w_${Math.random()}`,
            ownerId: champ.id,
            ownerType: 'champion',
            ownerTeam: champ.team,
            targetId: enemy.id,
            x: champ.x,
            y: champ.y,
            startX: champ.x,
            startY: champ.y,
            vx: 0,
            vy: 0,
            speed: 800,
            damage: 40 + champ.stats.abilityPower * 0.25,
            damageType: 'magic',
            color: '#38bdf8',
            size: 6,
            isSkillshot: false,
          });
        });
      } else if (key === 'E') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `ahri_e_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 850,
          vy: Math.sin(angle) * 850,
          speed: 850,
          damage: 80 + champ.stats.abilityPower * 0.6,
          damageType: 'magic',
          color: '#ec4899',
          size: 12,
          isSkillshot: true,
          maxDistance: 750,
          pierce: false,
          onHitEffect: 'charm',
        });
      } else if (key === 'R') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        champ.x += Math.cos(angle) * 450;
        champ.y += Math.sin(angle) * 450;
        this.addFloatingText(champ.x, champ.y - 30, '혼령 질주!', '#a855f7', 15);
      }
    } else if (champ.id === 'ashe') {
      if (key === 'Q') {
        champ.stats.attackSpeed = champ.baseStats.attackSpeed * 1.5;
        this.addFloatingText(champ.x, champ.y - 30, '궁사의 집중 발동!', '#38bdf8', 15);
        setTimeout(() => {
          champ.stats.attackSpeed = champ.baseStats.attackSpeed;
        }, 5000);
      } else if (key === 'W') {
        const baseAngle = Math.atan2(ty - champ.y, tx - champ.x);
        const spread = Math.PI / 6;
        for (let i = -3; i <= 3; i++) {
          const angle = baseAngle + (i * spread) / 3;
          this.projectiles.push({
            id: `ashe_w_${i}_${Math.random()}`,
            ownerId: champ.id,
            ownerType: 'champion',
            ownerTeam: champ.team,
            x: champ.x,
            y: champ.y,
            startX: champ.x,
            startY: champ.y,
            vx: Math.cos(angle) * 900,
            vy: Math.sin(angle) * 900,
            speed: 900,
            damage: 75 + champ.stats.attackDamage * 0.9,
            damageType: 'physical',
            color: '#38bdf8',
            size: 5,
            isSkillshot: true,
            maxDistance: 800,
            pierce: false,
            onHitEffect: 'slow',
          });
        }
      } else if (key === 'E') {
        this.addFloatingText(champ.x, champ.y - 30, '시야 정찰 매 발사!', '#60a5fa', 14);
      } else if (key === 'R') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `ashe_r_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 1100,
          vy: Math.sin(angle) * 1100,
          speed: 1100,
          damage: 250 + champ.stats.abilityPower * 1.0,
          damageType: 'magic',
          color: '#00f0ff',
          size: 20,
          isSkillshot: true,
          maxDistance: 3500,
          pierce: false,
          onHitEffect: 'stun',
        });
        this.screenShake = 6;
      }
    } else if (champ.id === 'yasuo') {
      if (key === 'Q') {
        const currentStacks = champ.tornadoStacks || 0;
        const angle = Math.atan2(ty - champ.y, tx - champ.x);

        if (currentStacks >= 2) {
          // 3rd Q: Tornado!
          champ.tornadoStacks = 0;
          this.projectiles.push({
            id: `yasuo_tornado_${Math.random()}`,
            ownerId: champ.id,
            ownerType: 'champion',
            ownerTeam: champ.team,
            x: champ.x,
            y: champ.y,
            startX: champ.x,
            startY: champ.y,
            vx: Math.cos(angle) * 900,
            vy: Math.sin(angle) * 900,
            speed: 900,
            damage: 100 + champ.stats.attackDamage * 1.0,
            damageType: 'physical',
            color: '#bae6fd',
            size: 24,
            isSkillshot: true,
            maxDistance: 800,
            pierce: true,
            onHitEffect: 'knockup',
          });
          this.screenShake = 8;
          this.addFloatingText(champ.x, champ.y - 35, '하사기! (토네이도)', '#38bdf8', 18);
        } else {
          // 1st/2nd Q: Thrust blade
          champ.tornadoStacks = currentStacks + 1;
          const enemies = this.getEnemiesOfTeam(champ.team);
          enemies.forEach((enemy) => {
            const d = Math.hypot(enemy.x - (champ.x + Math.cos(angle) * 200), enemy.y - (champ.y + Math.sin(angle) * 200));
            if (d < 220) {
              this.applyDamage(enemy, 75 + champ.stats.attackDamage * 1.0, 'physical', champ.id, 'champion', champ.team);
            }
          });
          this.addFloatingText(champ.x, champ.y - 35, `강철 폭풍 (${champ.tornadoStacks}/2)`, '#7dd3fc', 14);
        }
      } else if (key === 'W') {
        champ.shield = 160 + champ.stats.maxHp * 0.15;
        this.addFloatingText(champ.x, champ.y - 35, '바람의 장막! (보호막)', '#38bdf8', 15);
      } else if (key === 'E') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        champ.x += Math.cos(angle) * 380;
        champ.y += Math.sin(angle) * 380;
        // Damage enemies along dash
        const enemies = this.getEnemiesOfTeam(champ.team);
        enemies.forEach((e) => {
          if (Math.hypot(e.x - champ.x, e.y - champ.y) < 180) {
            this.applyDamage(e, 80 + champ.stats.attackDamage * 0.6, 'magic', champ.id, 'champion', champ.team);
          }
        });
        this.addFloatingText(champ.x, champ.y - 30, '질풍검 돌진!', '#38bdf8', 14);
      } else if (key === 'R') {
        // Last breath: Blink to airborne enemy!
        const airborneEnemy = this.getEnemiesOfTeam(champ.team).find((e) => (e.airborneTimer && e.airborneTimer > 0) || (e.stunTimer && e.stunTimer > 0));
        if (airborneEnemy) {
          champ.x = airborneEnemy.x - 40;
          champ.y = airborneEnemy.y;
          airborneEnemy.airborneTimer = 1.2;
          airborneEnemy.stunTimer = 1.2;
          this.applyDamage(airborneEnemy, 240 + champ.stats.attackDamage * 1.5, 'physical', champ.id, 'champion', champ.team, true);
          this.screenShake = 18;
          this.addFloatingText(airborneEnemy.x, airborneEnemy.y - 50, '소리에게돈! (최후의 숨결)', '#f59e0b', 22, false, true);
        } else {
          this.addFloatingText(champ.x, champ.y - 30, '공중에 뜬 적이 없습니다!', '#94a3b8', 13);
        }
      }
    } else if (champ.id === 'lux') {
      if (key === 'Q') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `lux_q_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 850,
          vy: Math.sin(angle) * 850,
          speed: 850,
          damage: 80 + champ.stats.abilityPower * 0.6,
          damageType: 'magic',
          color: '#fef08a',
          size: 16,
          isSkillshot: true,
          maxDistance: 900,
          pierce: false,
          onHitEffect: 'stun',
        });
      } else if (key === 'W') {
        champ.shield = 130 + champ.stats.abilityPower * 0.4;
        this.addFloatingText(champ.x, champ.y - 35, '프리즘 보호막!', '#fef08a', 15);
      } else if (key === 'E') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `lux_e_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 800,
          vy: Math.sin(angle) * 800,
          speed: 800,
          damage: 95 + champ.stats.abilityPower * 0.7,
          damageType: 'magic',
          color: '#fde047',
          size: 22,
          isSkillshot: true,
          maxDistance: 800,
          pierce: true,
          onHitEffect: 'slow',
        });
      } else if (key === 'R') {
        // Giant Final Spark Laser Beam!
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `lux_r_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 2500,
          vy: Math.sin(angle) * 2500,
          speed: 2500,
          damage: 320 + champ.stats.abilityPower * 1.2,
          damageType: 'magic',
          color: '#f43f5e',
          size: 32,
          isSkillshot: true,
          maxDistance: 2500,
          pierce: true,
        });
        this.screenShake = 16;
        this.addFloatingText(champ.x, champ.y - 45, '데마시아-! (최후의 섬광)', '#f43f5e', 22, false, true);
      }
    } else if (champ.id === 'leesin') {
      if (key === 'Q') {
        const angle = Math.atan2(ty - champ.y, tx - champ.x);
        this.projectiles.push({
          id: `leesin_q_${Math.random()}`,
          ownerId: champ.id,
          ownerType: 'champion',
          ownerTeam: champ.team,
          x: champ.x,
          y: champ.y,
          startX: champ.x,
          startY: champ.y,
          vx: Math.cos(angle) * 900,
          vy: Math.sin(angle) * 900,
          speed: 900,
          damage: 75 + champ.stats.attackDamage * 0.9,
          damageType: 'physical',
          color: '#f59e0b',
          size: 14,
          isSkillshot: true,
          maxDistance: 850,
          pierce: false,
        });
      } else if (key === 'W') {
        champ.shield = 140;
        this.addFloatingText(champ.x, champ.y - 30, '방호 보호막!', '#f59e0b', 14);
      } else if (key === 'E') {
        const enemies = this.getEnemiesOfTeam(champ.team);
        enemies.forEach((enemy) => {
          if (Math.hypot(enemy.x - champ.x, enemy.y - champ.y) <= 350) {
            this.applyDamage(enemy, 90 + champ.stats.attackDamage * 1.0, 'magic', champ.id, 'champion', champ.team);
            if (enemy.stats) enemy.stats.moveSpeed *= 0.6;
          }
        });
        this.addFloatingText(champ.x, champ.y - 30, '폭풍 슬램!', '#fbbf24', 15);
      } else if (key === 'R') {
        const target = this.findEnemyNear(tx, ty, champ.team);
        if (target) {
          const kickAngle = Math.atan2(target.y - champ.y, target.x - champ.x);
          target.x += Math.cos(kickAngle) * 400;
          target.y += Math.sin(kickAngle) * 400;
          this.applyDamage(target, 250 + champ.stats.attackDamage * 2.0, 'physical', champ.id, 'champion', champ.team, true);
          this.screenShake = 16;
          this.addFloatingText(target.x, target.y - 45, '이쿠-! (용의 분노)', '#f59e0b', 22, false, true);
        }
      }
    }

    if (champ === this.player && this.currentTutorialStep === 2) {
      this.tutorialObjectives[1].currentCount = 1;
      this.checkTutorialCompletion();
    }

    this.notifyPlayerUpdate();
  }

  // Summoner Spells (Flash, Ignite, Heal)
  public castSummonerSpell(key: 'D' | 'F') {
    const spell = this.player.summonerSpells[key];
    if (spell.cooldown > 0 || this.player.isDead) return;

    spell.cooldown = spell.maxCooldown;

    if (spell.id === 'flash') {
      soundManager.playFlash();
      const angle = Math.atan2(this.mouseMapY - this.player.y, this.mouseMapX - this.player.x);
      const dist = Math.min(420, Math.hypot(this.mouseMapX - this.player.x, this.mouseMapY - this.player.y));
      this.player.x += Math.cos(angle) * dist;
      this.player.y += Math.sin(angle) * dist;
      this.addFloatingText(this.player.x, this.player.y - 35, '점멸!', '#38bdf8', 16);
    } else if (spell.id === 'ignite') {
      const enemy = this.findEnemyNear(this.mouseMapX, this.mouseMapY, this.player.team);
      if (enemy) {
        soundManager.playSkill('garen', 'Q');
        this.addFloatingText(enemy.x, enemy.y - 40, '점화! (고정 피해)', '#ef4444', 16);
        let ticks = 0;
        const interval = setInterval(() => {
          ticks++;
          this.applyDamage(enemy, 35, 'true', this.player.id, 'champion', this.player.team);
          if (ticks >= 5 || enemy.isDead) clearInterval(interval);
        }, 1000);
      }
    } else if (spell.id === 'heal') {
      soundManager.playGold();
      this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 200);
      this.player.stats.moveSpeed = this.player.baseStats.moveSpeed * 1.3;
      setTimeout(() => {
        this.player.stats.moveSpeed = this.player.baseStats.moveSpeed;
      }, 1500);
      this.addFloatingText(this.player.x, this.player.y - 35, '+200 체력 회복!', '#22c55e', 16);
    }

    this.notifyPlayerUpdate();
  }

  // Recall Channeling (B)
  public startRecall() {
    if (this.player.isDead || this.player.isRecalling) return;
    this.player.isRecalling = true;
    this.player.recallTimer = 8.0;
    this.player.targetX = undefined;
    this.player.targetY = undefined;
    this.player.targetUnitId = null;
    soundManager.playRecall();
    this.addFloatingText(this.player.x, this.player.y - 35, '귀환 중... (8초)', '#38bdf8', 15);
    this.notifyPlayerUpdate();
  }

  // Level Up Skill
  public levelUpSkill(key: 'Q' | 'W' | 'E' | 'R') {
    if (this.player.skillPoints <= 0) return;
    const skill = this.player.skills[key];
    if (skill.level >= skill.maxLevel) return;
    if (key === 'R' && this.player.level < 6) return;

    skill.level++;
    this.player.skillPoints--;
    soundManager.playLevelUp();
    this.addFloatingText(this.player.x, this.player.y - 40, `${skill.nameKr} 레벨 업!`, '#f59e0b', 16);

    if (this.currentTutorialStep === 2) {
      this.tutorialObjectives[1].currentCount = 1;
      this.checkTutorialCompletion();
    }

    this.notifyPlayerUpdate();
  }

  // Buy Item
  public buyItem(item: Item): boolean {
    if (this.player.gold < item.cost) return false;
    const emptyIndex = this.player.items.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return false;

    this.player.gold -= item.cost;
    this.player.items[emptyIndex] = item;

    if (item.ad) this.player.stats.attackDamage += item.ad;
    if (item.ap) this.player.stats.abilityPower += item.ap;
    if (item.hp) {
      this.player.stats.maxHp += item.hp;
      this.player.stats.hp += item.hp;
    }
    if (item.armor) this.player.stats.armor += item.armor;
    if (item.attackSpeed) this.player.stats.attackSpeed += item.attackSpeed;
    if (item.moveSpeed) this.player.stats.moveSpeed += item.moveSpeed;
    if (item.critChance) this.player.stats.critChance += item.critChance;

    soundManager.playBuyItem();
    this.addFloatingText(this.player.x, this.player.y - 35, `${item.nameKr} 구매!`, '#eab308', 16, true);

    if (this.currentTutorialStep === 6) {
      this.tutorialObjectives[5].currentCount = 1;
      this.checkTutorialCompletion();
    }

    this.notifyPlayerUpdate();
    return true;
  }

  // ==========================================
  // INPUT HANDLERS
  // ==========================================
  public handleRightClick(screenX: number, screenY: number) {
    const mapPos = this.screenToMap(screenX, screenY);
    this.mouseMapX = mapPos.x;
    this.mouseMapY = mapPos.y;
    this.isAttackMoveMode = false;
    this.isAttackMovingToTarget = false;
    this.attackMoveDestination = null;

    const clickedTarget = this.findUnitAt(mapPos.x, mapPos.y);

    if (clickedTarget && clickedTarget.team !== this.player.team) {
      // Attack target
      this.player.targetUnitId = clickedTarget.id;
      this.player.targetUnitType = clickedTarget.type || 'minion';
      this.clickEffects.push({
        x: mapPos.x,
        y: mapPos.y,
        color: '#ef4444',
        radius: 10,
        maxRadius: 35,
        opacity: 1,
      });
    } else {
      // Move to ground
      this.player.targetUnitId = null;
      this.player.targetUnitType = null;
      this.player.targetX = mapPos.x;
      this.player.targetY = mapPos.y;
      this.clickEffects.push({
        x: mapPos.x,
        y: mapPos.y,
        color: '#22c55e',
        radius: 10,
        maxRadius: 35,
        opacity: 1,
      });
    }

    if (this.player.isRecalling) {
      this.player.isRecalling = false;
      this.addFloatingText(this.player.x, this.player.y - 30, '귀환 취소됨', '#f87171', 13);
    }

    this.notifyPlayerUpdate();
  }

  public handleLeftClick(screenX: number, screenY: number) {
    const mapPos = this.screenToMap(screenX, screenY);
    this.mouseMapX = mapPos.x;
    this.mouseMapY = mapPos.y;

    if (this.aimingSkill) {
      this.castSkill(this.player, this.aimingSkill, mapPos.x, mapPos.y);
      this.aimingSkill = null;
      return;
    }

    if (this.isAttackMoveMode) {
      // Attack-move click confirmed!
      this.isAttackMoveMode = false;
      this.isAttackMovingToTarget = true;
      this.attackMoveDestination = { x: mapPos.x, y: mapPos.y };
      this.player.targetX = mapPos.x;
      this.player.targetY = mapPos.y;
      this.player.targetUnitId = null;

      this.clickEffects.push({
        x: mapPos.x,
        y: mapPos.y,
        color: '#f59e0b',
        radius: 12,
        maxRadius: 40,
        opacity: 1,
      });

      this.checkAttackMoveScanning();
      return;
    }

    const clicked = this.findUnitAt(mapPos.x, mapPos.y);
    if (clicked) {
      this.selectedUnit = { id: clicked.id, type: clicked.type || 'minion', team: clicked.team };
    } else {
      this.selectedUnit = null;
    }
  }

  public triggerAttackMoveMode() {
    this.isAttackMoveMode = true;
  }

  public handleMouseMove(screenX: number, screenY: number) {
    const mapPos = this.screenToMap(screenX, screenY);
    this.mouseMapX = mapPos.x;
    this.mouseMapY = mapPos.y;
  }

  public screenToMap(sx: number, sy: number): { x: number; y: number } {
    return {
      x: sx + this.cameraX,
      y: sy + this.cameraY,
    };
  }

  public mapToScreen(mx: number, my: number): { x: number; y: number } {
    return {
      x: mx - this.cameraX,
      y: my - this.cameraY,
    };
  }

  // ==========================================
  // TUTORIAL STEP TRACKING
  // ==========================================
  private trackPlayerMovement(dist: number) {
    if (this.currentTutorialStep === 1 && !this.tutorialObjectives[0].completed) {
      this.distanceMovedInTutorial += dist;
      this.tutorialObjectives[0].currentCount = Math.min(500, Math.round(this.distanceMovedInTutorial));
      if (this.distanceMovedInTutorial >= 500) {
        this.checkTutorialCompletion();
      }
      this.listener.onTutorialProgress(this.tutorialObjectives, this.currentTutorialStep);
    }
  }

  private checkTutorialCompletion() {
    const obj = this.tutorialObjectives[this.currentTutorialStep - 1];
    if (obj && !obj.completed && obj.currentCount >= obj.targetCount) {
      obj.completed = true;
      soundManager.playGold();
      this.addFloatingText(this.player.x, this.player.y - 60, `퀘스트 완료! ${obj.title}`, '#eab308', 25, true);

      if (this.currentTutorialStep < this.tutorialObjectives.length) {
        this.currentTutorialStep++;
      }
      this.listener.onTutorialProgress(this.tutorialObjectives, this.currentTutorialStep);
    }
  }

  public advanceTutorialStep() {
    if (this.currentTutorialStep < this.tutorialObjectives.length) {
      this.tutorialObjectives[this.currentTutorialStep - 1].completed = true;
      this.currentTutorialStep++;
      this.listener.onTutorialProgress(this.tutorialObjectives, this.currentTutorialStep);
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private findUnitById(id?: string | null, type?: UnitType | null): any {
    if (!id) return null;
    if (id === this.player.id) return this.player;
    if (this.enemyChampion && id === this.enemyChampion.id) return this.enemyChampion;
    if (this.targetDummy && id === this.targetDummy.id) return this.targetDummy;

    const minion = this.minions.find((m) => m.id === id);
    if (minion) return minion;

    const turret = this.turrets.find((t) => t.id === id);
    if (turret) return turret;

    const monster = this.monsters.find((m) => m.id === id);
    if (monster) return monster;

    if (id === this.nexuses.blue.id) return this.nexuses.blue;
    if (id === this.nexuses.red.id) return this.nexuses.red;

    return null;
  }

  private findUnitAt(x: number, y: number): any {
    if (this.enemyChampion && !this.enemyChampion.isDead && Math.hypot(this.enemyChampion.x - x, this.enemyChampion.y - y) <= this.enemyChampion.radius + 15) {
      return this.enemyChampion;
    }
    if (this.targetDummy && Math.hypot(this.targetDummy.x - x, this.targetDummy.y - y) <= this.targetDummy.radius + 15) {
      return this.targetDummy;
    }
    for (const m of this.minions) {
      if (!m.isDead && Math.hypot(m.x - x, m.y - y) <= m.radius + 14) {
        return m;
      }
    }
    for (const t of this.turrets) {
      if (!t.isDead && Math.hypot(t.x - x, t.y - y) <= t.radius + 15) {
        return t;
      }
    }
    for (const m of this.monsters) {
      if (!m.isDead && Math.hypot(m.x - x, m.y - y) <= m.radius + 15) {
        return m;
      }
    }
    if (!this.nexuses.red.isDead && Math.hypot(this.nexuses.red.x - x, this.nexuses.red.y - y) <= this.nexuses.red.radius + 20) {
      return this.nexuses.red;
    }
    if (!this.nexuses.blue.isDead && Math.hypot(this.nexuses.blue.x - x, this.nexuses.blue.y - y) <= this.nexuses.blue.radius + 20) {
      return this.nexuses.blue;
    }
    return null;
  }

  private findEnemyNear(x: number, y: number, myTeam: Team): any {
    const enemies = this.getEnemiesOfTeam(myTeam);
    let closest: any = null;
    let minDist = 450;
    enemies.forEach((e) => {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    });
    return closest;
  }

  private getEnemiesOfTeam(team: Team): any[] {
    const list: any[] = [];
    if (team === 'blue') {
      if (this.enemyChampion && !this.enemyChampion.isDead) list.push(this.enemyChampion);
      this.minions.filter((m) => m.team === 'red' && !m.isDead).forEach((m) => list.push(m));
      this.turrets.filter((t) => t.team === 'red' && !t.isDead).forEach((t) => list.push(t));
      if (!this.nexuses.red.isDead) list.push(this.nexuses.red);
      if (this.targetDummy) list.push(this.targetDummy);
      this.monsters.filter((m) => !m.isDead).forEach((m) => list.push(m));
    } else {
      if (!this.player.isDead) list.push(this.player);
      this.minions.filter((m) => m.team === 'blue' && !m.isDead).forEach((m) => list.push(m));
      this.turrets.filter((t) => t.team === 'blue' && !t.isDead).forEach((t) => list.push(t));
      if (!this.nexuses.blue.isDead) list.push(this.nexuses.blue);
    }
    return list;
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number = 14, isGold: boolean = false, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      size,
      opacity: 1,
      duration: 1.2,
      elapsed: 0,
      isGold,
      isCrit,
    });
  }

  private notifyPlayerUpdate() {
    this.listener.onPlayerUpdate(this.player);
  }

  public formatGameTime(): string {
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ==========================================
  // RENDERING ENGINE
  // ==========================================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Draw Map & Terrain with High Fidelity Textures
    this.renderMap(ctx);

    // 2. Draw Ambient Wind Particles
    this.renderAmbientParticles(ctx);

    // 3. Draw Turret Attack Range indicators
    this.renderTurretRanges(ctx);

    // 4. Draw Bushes
    this.renderBushes(ctx);

    // 5. Draw Turrets, Inhibitors, Nexuses
    this.renderStructures(ctx);

    // 6. Draw Jungle Monsters
    this.renderMonsters(ctx);

    // 7. Draw Target Dummy
    if (this.targetDummy) {
      this.renderTargetDummy(ctx, this.targetDummy);
    }

    // 8. Draw Minions with Aggro Indicators and Last Hit Alerts
    this.renderMinions(ctx);

    // 9. Draw Champions
    if (this.enemyChampion && !this.enemyChampion.isDead) {
      this.renderChampion(ctx, this.enemyChampion, false);
    }
    if (!this.player.isDead) {
      this.renderChampion(ctx, this.player, true);
    }

    // 10. Draw Projectiles
    this.renderProjectiles(ctx);

    // 11. Draw Click ripples & Attack Move range
    this.renderClickEffects(ctx);
    if (this.isAttackMoveMode) {
      this.renderAttackMoveReticle(ctx);
    }

    // 12. Draw Skill Aiming Reticle (if aiming)
    this.renderSkillAiming(ctx);

    // 13. Draw Floating Combat Text
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  // Enhanced Summoner's Rift Map Graphics
  private renderMap(ctx: CanvasRenderingContext2D) {
    // Base grass background
    ctx.fillStyle = '#18311a';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Subtle grass texture tiles
    ctx.fillStyle = '#1c381e';
    for (let x = 0; x < MAP_WIDTH; x += 180) {
      for (let y = 0; y < MAP_HEIGHT; y += 180) {
        if ((x + y) % 360 === 0) {
          ctx.fillRect(x, y, 180, 180);
        }
      }
    }

    // Animated River with water ripples
    ctx.save();
    ctx.fillStyle = '#0a2335';
    ctx.beginPath();
    ctx.moveTo(0, 3000);
    ctx.lineTo(340, 3000);
    ctx.lineTo(3000, 340);
    ctx.lineTo(3000, 0);
    ctx.lineTo(2660, 0);
    ctx.lineTo(0, 2660);
    ctx.closePath();
    ctx.fill();

    // River water glow/shimmer
    const shimmerOffset = Math.sin(this.gameTime * 2) * 10;
    ctx.strokeStyle = '#1b4b6b';
    ctx.lineWidth = 16;
    ctx.stroke();

    // River caustic wave highlights
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 3;
    for (let i = 200; i < 3000; i += 400) {
      ctx.beginPath();
      ctx.arc(i + shimmerOffset, 3000 - i, 80, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();

    // Mid Lane Cobblestone Road
    ctx.save();
    ctx.strokeStyle = '#4e4334';
    ctx.lineWidth = 190;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(450, 2550);
    ctx.lineTo(2550, 450);
    ctx.stroke();

    // Inner paved stones
    ctx.strokeStyle = '#635644';
    ctx.lineWidth = 130;
    ctx.stroke();

    // Cobblestone tile cracks / paving lines
    ctx.strokeStyle = '#3e3528';
    ctx.lineWidth = 2;
    for (let t = 0; t <= 1; t += 0.05) {
      const cx = 450 + (2550 - 450) * t;
      const cy = 2550 + (450 - 2550) * t;
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 50);
      ctx.lineTo(cx + 50, cy + 50);
      ctx.stroke();
    }
    ctx.restore();

    // Base Platforms (Fountain)
    // Blue Base
    ctx.fillStyle = '#101e33';
    ctx.beginPath();
    ctx.arc(450, 2550, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Red Base
    ctx.fillStyle = '#331212';
    ctx.beginPath();
    ctx.arc(2550, 450, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  private renderAmbientParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = 'rgba(167, 243, 208, 0.4)';
    for (const p of this.ambientParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderBushes(ctx: CanvasRenderingContext2D) {
    BUSHES.forEach((bush) => {
      ctx.save();
      // Bush shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(bush.x + 4, bush.y + 6, bush.width, bush.height, 20);
      ctx.fill();

      // Bush body
      ctx.fillStyle = 'rgba(20, 83, 45, 0.92)';
      ctx.beginPath();
      ctx.roundRect(bush.x, bush.y, bush.width, bush.height, 20);
      ctx.fill();

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Leaf clusters
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < bush.width; i += 28) {
        ctx.beginPath();
        ctx.arc(bush.x + i + 14, bush.y + bush.height / 2, 13, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private renderTurretRanges(ctx: CanvasRenderingContext2D) {
    this.turrets.forEach((turret) => {
      if (turret.isDead) return;

      const distToPlayer = Math.hypot(this.player.x - turret.x, this.player.y - turret.y);
      const isPlayerInRange = distToPlayer <= turret.range;
      const isEnemy = turret.team !== this.player.team;

      ctx.save();
      ctx.beginPath();
      ctx.arc(turret.x, turret.y, turret.range, 0, Math.PI * 2);
      ctx.strokeStyle = isEnemy
        ? isPlayerInRange
          ? 'rgba(239, 68, 68, 0.6)'
          : 'rgba(239, 68, 68, 0.18)'
        : 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = isPlayerInRange && isEnemy ? 3 : 1.5;
      ctx.stroke();

      // Laser beam line if attacking target
      if (turret.targetUnitId) {
        const target = this.findUnitById(turret.targetUnitId, turret.targetUnitType);
        if (target && !target.isDead) {
          ctx.beginPath();
          ctx.moveTo(turret.x, turret.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = turret.team === 'blue' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  private renderStructures(ctx: CanvasRenderingContext2D) {
    // Turrets
    this.turrets.forEach((turret) => {
      if (turret.isDead) {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, turret.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      ctx.save();
      // Drop Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.arc(turret.x + 6, turret.y + 8, turret.radius, 0, Math.PI * 2);
      ctx.fill();

      // Stone base
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(turret.x, turret.y, turret.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Glowing Crystal with pulse
      const crystalColor = turret.team === 'blue' ? '#38bdf8' : '#f87171';
      ctx.fillStyle = crystalColor;
      ctx.shadowColor = crystalColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(turret.x, turret.y, turret.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      this.renderSegmentedHealthBar(ctx, turret.x, turret.y - turret.radius - 18, turret.hp, turret.maxHp, 84, 8, turret.team, '포탑');
    });

    // Nexuses
    (['blue', 'red'] as const).forEach((team) => {
      const nexus = this.nexuses[team];
      if (nexus.isDead) return;

      ctx.save();
      ctx.fillStyle = team === 'blue' ? '#0f172a' : '#2d1515';
      ctx.beginPath();
      ctx.arc(nexus.x, nexus.y, nexus.radius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating energy ring
      ctx.strokeStyle = team === 'blue' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(nexus.x, nexus.y, nexus.radius + 10, this.gameTime * 2, this.gameTime * 2 + Math.PI * 1.5);
      ctx.stroke();

      // Giant Diamond Crystal
      const color = team === 'blue' ? '#00e5ff' : '#ff1744';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;

      const size = 35;
      ctx.beginPath();
      ctx.moveTo(nexus.x, nexus.y - size);
      ctx.lineTo(nexus.x + size, nexus.y);
      ctx.lineTo(nexus.x, nexus.y + size);
      ctx.lineTo(nexus.x - size, nexus.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      this.renderSegmentedHealthBar(ctx, nexus.x, nexus.y - nexus.radius - 24, nexus.hp, nexus.maxHp, 120, 12, team, '넥서스');
    });
  }

  private renderMonsters(ctx: CanvasRenderingContext2D) {
    this.monsters.forEach((monster) => {
      if (monster.isDead) return;

      ctx.save();
      const isBaron = monster.type === 'baron';
      const isDragon = monster.type === 'dragon';

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(monster.x + 4, monster.y + 6, monster.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isBaron ? '#581c87' : isDragon ? '#c2410c' : monster.buffType === 'blue' ? '#0369a1' : '#b91c1c';
      ctx.beginPath();
      ctx.arc(monster.x, monster.y, monster.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText(monster.nameKr, monster.x, monster.y + 4);
      ctx.restore();

      this.renderSegmentedHealthBar(ctx, monster.x, monster.y - monster.radius - 14, monster.hp, monster.maxHp, monster.radius * 2 + 10, 7, 'neutral', monster.nameKr);
    });
  }

  private renderTargetDummy(ctx: CanvasRenderingContext2D, dummy: TargetDummy) {
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(dummy.x, dummy.y, dummy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText('연습용 허수아비', dummy.x, dummy.y + 4);
    ctx.restore();

    this.renderSegmentedHealthBar(ctx, dummy.x, dummy.y - dummy.radius - 12, dummy.hp, dummy.maxHp, 80, 7, 'neutral', '더미');
  }

  private renderMinions(ctx: CanvasRenderingContext2D) {
    this.minions.forEach((minion) => {
      ctx.save();
      const isBlue = minion.team === 'blue';
      const bodyColor = isBlue ? '#2563eb' : '#dc2626';

      // Unit Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(minion.x + 2, minion.y + 4, minion.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Minion Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isBlue ? '#93c5fd' : '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner icon
      ctx.fillStyle = '#ffffff';
      ctx.font = `${minion.type === 'cannon' ? 14 : 10}px Plus Jakarta Sans`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(minion.type === 'melee' ? '⚔️' : minion.type === 'caster' ? '✨' : '💣', minion.x, minion.y);

      // Aggro alert marker
      if (minion.aggroTargetId) {
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 12px Plus Jakarta Sans';
        ctx.fillText('❗', minion.x, minion.y - minion.radius - 18);
      }
      ctx.restore();

      // Last Hit Threshold: when minion hp <= player basic attack damage
      const canKill = !isBlue && minion.hp <= (this.player.stats.attackDamage * 1.0);
      this.renderMinionHealthBar(ctx, minion.x, minion.y - minion.radius - 8, minion.hp, minion.maxHp, minion.radius * 2 + 6, minion.team, canKill);
    });
  }

  private renderChampion(ctx: CanvasRenderingContext2D, champ: Champion, isPlayer: boolean) {
    ctx.save();

    // Unit Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(champ.x + 4, champ.y + 6, champ.radius * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Garen Spin effect
    if (champ.isSpinning) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(champ.x, champ.y, 160, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shield aura
    if (champ.shield > 0) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(champ.x, champ.y, champ.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Recall Channeling ring
    if (champ.isRecalling) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(champ.x, champ.y, champ.radius + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Champion Portrait Circle
    const img = this.championImages[champ.id];
    ctx.beginPath();
    ctx.arc(champ.x, champ.y, champ.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, champ.x - champ.radius, champ.y - champ.radius, champ.radius * 2, champ.radius * 2);
    } else {
      // Themed champion visual badge
      const champColors: Record<string, string> = {
        yasuo: '#0284c7',
        lux: '#eab308',
        leesin: '#b45309',
        garen: '#2563eb',
        ahri: '#db2777',
        ashe: '#0284c7',
      };
      const champIcons: Record<string, string> = {
        yasuo: '🌪️',
        lux: '✨',
        leesin: '👊',
        garen: '⚔️',
        ahri: '🔮',
        ashe: '🏹',
      };
      ctx.fillStyle = champColors[champ.id] || (champ.team === 'blue' ? '#2563eb' : '#dc2626');
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(champ.radius * 0.9)}px Plus Jakarta Sans`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(champIcons[champ.id] || '⚔️', champ.x, champ.y);
    }
    ctx.restore();

    // Champion Outline ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(champ.x, champ.y, champ.radius, 0, Math.PI * 2);
    ctx.strokeStyle = isPlayer ? '#fbbf24' : champ.team === 'blue' ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = isPlayer ? 3.5 : 2.5;
    ctx.stroke();
    ctx.restore();

    this.renderChampionFloatingHUD(ctx, champ, isPlayer);
  }

  // League of Legends authentic Segmented Floating Health Bar
  private renderChampionFloatingHUD(ctx: CanvasRenderingContext2D, champ: Champion, isPlayer: boolean) {
    const barWidth = 100;
    const barHeight = 8;
    const barX = champ.x - barWidth / 2;
    const barY = champ.y - champ.radius - 22;

    // Level badge circle on left
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(barX - 10, barY + barHeight / 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isPlayer ? '#fbbf24' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${champ.level}`, barX - 10, barY + barHeight / 2);

    // Health bar background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar fill
    const hpRatio = Math.max(0, champ.stats.hp / champ.stats.maxHp);
    ctx.fillStyle = isPlayer ? '#22c55e' : champ.team === 'blue' ? '#38bdf8' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // Shield overlay
    if (champ.shield > 0) {
      const shieldRatio = Math.min(1 - hpRatio, champ.shield / champ.stats.maxHp);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(barX + barWidth * hpRatio, barY, barWidth * shieldRatio, barHeight);
    }

    // Health notches (100 HP per notch)
    const totalNotches = Math.floor(champ.stats.maxHp / 100);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (let i = 1; i <= totalNotches; i++) {
      const nx = barX + (i / totalNotches) * barWidth;
      ctx.fillRect(nx, barY, 1, barHeight);
    }

    // Mana bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barX, barY + barHeight + 1, barWidth, 4);
    const manaRatio = Math.max(0, champ.stats.mana / champ.stats.maxMana);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(barX, barY + barHeight + 1, barWidth * manaRatio, 4);

    // Champion NameKr above bar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(champ.nameKr, champ.x, barY - 2);
  }

  private renderSegmentedHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, width: number, height: number, team: Team, label?: string) {
    const rx = x - width / 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx, y, width, height);

    const ratio = Math.max(0, hp / maxHp);
    ctx.fillStyle = team === 'blue' ? '#38bdf8' : team === 'red' ? '#ef4444' : '#eab308';
    ctx.fillRect(rx, y, width * ratio, height);

    // Notches
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const notchCount = Math.floor(maxHp / 500);
    for (let i = 1; i <= notchCount; i++) {
      const nx = rx + (i / notchCount) * width;
      ctx.fillRect(nx, y, 1, height);
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, y, width, height);
  }

  private renderMinionHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, width: number, team: Team, canKill: boolean) {
    const rx = x - width / 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx, y, width, 5);

    const ratio = Math.max(0, hp / maxHp);
    ctx.fillStyle = canKill ? '#fef08a' : team === 'blue' ? '#38bdf8' : '#ef4444';
    ctx.fillRect(rx, y, width * ratio, 5);

    if (canKill) {
      // Flashing gold outline & indicator
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, y, width, 5);

      // Gold crown / dot
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x, y - 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    this.projectiles.forEach((proj) => {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderClickEffects(ctx: CanvasRenderingContext2D) {
    this.clickEffects.forEach((eff) => {
      ctx.save();
      ctx.strokeStyle = eff.color;
      ctx.globalAlpha = eff.opacity;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  private renderAttackMoveReticle(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Attack range circle
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.stats.attackRange, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Red cursor reticle
    ctx.beginPath();
    ctx.arc(this.mouseMapX, this.mouseMapY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private renderSkillAiming(ctx: CanvasRenderingContext2D) {
    if (!this.aimingSkill) return;
    const skill = this.player.skills[this.aimingSkill];

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, skill.range, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y);
    ctx.lineTo(this.mouseMapX, this.mouseMapY);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.opacity;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px Plus Jakarta Sans`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  public getSmartCoachTip(): string {
    if (this.player.isDead) {
      return '💀 부활 대기 중입니다. 부활 즉시 라인으로 복귀하여 미니언 경험치를 놓치지 마세요!';
    }
    if (this.player.stats.hp < this.player.stats.maxHp * 0.3) {
      return '⚠️ 체력이 위험합니다! 안전한 곳에서 B키를 눌러 본진으로 귀환하여 체력을 회복하세요.';
    }
    if (this.player.gold >= 1100 && this.player.items.filter((i) => i !== null).length < 6) {
      return '🪙 골드가 충분히 모였습니다! 라인을 밀고 B키 귀환 후 상점(P)에서 신발이나 코어템을 사세요.';
    }
    if (this.enemyChampion && !this.enemyChampion.isDead) {
      const dist = Math.hypot(this.enemyChampion.x - this.player.x, this.enemyChampion.y - this.player.y);
      if (this.enemyChampion.stats.hp < this.enemyChampion.stats.maxHp * 0.35 && dist < 650) {
        return '🔥 절호의 킬 찬스! 적 체력이 낮습니다. 점멸(D) + 궁극기(R) + 점화(F) 연계로 킬을 따내세요!';
      }
    }
    if (this.player.skillPoints > 0) {
      return '✨ 스킬 포인트 사용 가능! 스킬 아이콘 위의 [+] 버튼을 눌러 스킬 레벨을 올리세요.';
    }
    if (this.player.level < 3) {
      return '🌱 초반 1~3레벨: 체력바가 하얗게 빛나는 [막타 가능] 미니언만 우클릭으로 때려 골드를 수급하세요.';
    }
    return '⚔️ 아군 미니언과 함께 진격하여 적 포탑을 압박하고 승리를 쟁취하세요!';
  }
}


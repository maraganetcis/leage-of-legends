export type Team = 'blue' | 'red' | 'neutral';

export interface Vector2D {
  x: number;
  y: number;
}

export type UnitType = 'champion' | 'minion' | 'turret' | 'inhibitor' | 'nexus' | 'monster' | 'dummy';

export interface Skill {
  key: 'Q' | 'W' | 'E' | 'R';
  name: string;
  nameKr: string;
  description: string;
  descriptionKr: string;
  level: number;
  maxLevel: number;
  cooldown: number; // current cooldown left in seconds
  maxCooldown: number;
  manaCost: number;
  range: number;
  targetType: 'skillshot' | 'target' | 'self' | 'aoe' | 'dash';
  icon: string;
}

export interface SummonerSpell {
  key: 'D' | 'F';
  id: 'flash' | 'ignite' | 'heal';
  name: string;
  nameKr: string;
  descriptionKr: string;
  cooldown: number;
  maxCooldown: number;
  icon: string;
}

export interface Item {
  id: string;
  name: string;
  nameKr: string;
  descriptionKr: string;
  cost: number;
  ad?: number;
  ap?: number;
  hp?: number;
  armor?: number;
  magicResist?: number;
  attackSpeed?: number;
  moveSpeed?: number;
  critChance?: number;
  icon: string;
  passiveNameKr?: string;
  category: 'starter' | 'attack' | 'magic' | 'defense' | 'boots';
}

export interface ChampionStats {
  hp: number;
  maxHp: number;
  hpRegen: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  attackDamage: number;
  abilityPower: number;
  armor: number;
  magicResist: number;
  attackSpeed: number; // attacks per second
  attackRange: number;
  moveSpeed: number;
  critChance: number;
}

export interface Champion {
  id: string;
  name: string;
  nameKr: string;
  titleKr: string;
  portraitUrl: string;
  team: Team;
  x: number;
  y: number;
  radius: number;
  targetX?: number;
  targetY?: number;
  targetUnitId?: string | null;
  targetUnitType?: UnitType | null;
  stats: ChampionStats;
  baseStats: ChampionStats;
  level: number;
  exp: number;
  maxExp: number;
  skillPoints: number;
  skills: {
    Q: Skill;
    W: Skill;
    E: Skill;
    R: Skill;
  };
  summonerSpells: {
    D: SummonerSpell;
    F: SummonerSpell;
  };
  items: (Item | null)[]; // 6 slots
  gold: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  isDead: boolean;
  respawnTimer: number;
  isRecalling: boolean;
  recallTimer: number;
  attackCooldown: number;
  shield: number;
  isSpinning?: boolean; // For Garen E
  spinDuration?: number;
  speedBoostTimer?: number;
  silencedTimer?: number;
  charmedTimer?: number;
  stunTimer?: number;
  airborneTimer?: number; // For Yasuo tornado knockup
  tornadoStacks?: number; // 0, 1, 2 for Yasuo Q
  slowTimer?: number;
  hasBaronBuff?: boolean;
  hasDragonBuff?: boolean;
  hasRedBuff?: boolean;
  hasBlueBuff?: boolean;
}


export interface Minion {
  id: string;
  team: Team;
  lane: 'mid' | 'top' | 'bot';
  type: 'melee' | 'caster' | 'cannon';
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  maxAttackCooldown: number;
  speed: number;
  targetUnitId: string | null;
  targetUnitType: UnitType | null;
  goldValue: number;
  expValue: number;
  waypointIndex: number;
  isDead: boolean;
  aggroTargetId?: string | null; // Targeted champion aggro
  aggroTimer?: number; // Aggro duration (e.g. 2.5s)
}


export interface Turret {
  id: string;
  team: Team;
  lane: 'mid' | 'top' | 'bot';
  tier: 'outer' | 'inner' | 'inhibitor' | 'nexus1' | 'nexus2';
  x: number;
  y: number;
  radius: number;
  range: number;
  hp: number;
  maxHp: number;
  attackDamage: number;
  attackCooldown: number;
  maxAttackCooldown: number;
  targetUnitId: string | null;
  targetUnitType: UnitType | null;
  consecutiveShots: number;
  isDead: boolean;
}

export interface Inhibitor {
  id: string;
  team: Team;
  lane: 'mid' | 'top' | 'bot';
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
  respawnTimer: number;
}

export interface Nexus {
  id: string;
  team: Team;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
}

export interface Monster {
  id: string;
  type: 'blue_buff' | 'red_buff' | 'dragon' | 'baron';
  nameKr: string;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  radius: number;
  hp: number;
  maxHp: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  maxAttackCooldown: number;
  speed: number;
  targetUnitId: string | null;
  targetUnitType: UnitType | null;
  goldValue: number;
  expValue: number;
  isDead: boolean;
  respawnTimer: number;
  buffType: 'blue' | 'red' | 'dragon' | 'baron';
}

export interface TargetDummy {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  armor: number;
  magicResist: number;
  damageTaken: number;
  dps: number;
  lastDamageTime: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  ownerType: UnitType;
  ownerTeam: Team;
  targetId?: string;
  targetType?: UnitType;
  x: number;
  y: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  speed: number;
  damage: number;
  damageType: 'physical' | 'magic' | 'true';
  color: string;
  size: number;
  isSkillshot: boolean;
  maxDistance?: number;
  distanceTraveled?: number;
  pierce?: boolean;
  hitUnitIds?: string[];
  onHitEffect?: 'stun' | 'slow' | 'charm' | 'burn' | 'return' | 'knockup';
  skillSource?: 'Q' | 'W' | 'E' | 'R' | 'auto';
  isReturning?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
  duration: number;
  elapsed: number;
  isGold?: boolean;
  isCrit?: boolean;
}

export interface ClickEffect {
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export interface Bush {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialObjective {
  step: number;
  title: string;
  description: string;
  hint: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export type GameMode = 'tutorial' | 'match' | 'practice';

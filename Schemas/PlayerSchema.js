import mongoose from 'mongoose';
import { type } from 'os';
const Schema = mongoose.Schema;

// Modifiers Schema
const ModifiersSchema = new Schema({
  intelligence: { type: Number },
  dexterity: { type: Number },
  constitution: { type: Number },
  insanity: { type: Number },
  charisma: { type: Number },
  strength: { type: Number },
  hit_points: { type: Number, default: 0 }, // Optional, specific to certain items
});

// Base Equipment Schema
const BaseEquipmentSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, auto: true },
  name: { type: String },
  description: { type: String },
  type: { type: String },
  image: { type: String },
  value: { type: Number },
  min_lvl: { type: Number },
  modifiers: { type: ModifiersSchema },
});
// Enhancer Potion Schema
const EnhancerPotionSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, auto: true },
  name: { type: String },
  description: { type: String },
  type: { type: String, enum: ["enhancer", "elixir"] },
  image: { type: String },
  value: { type: Number },
  duration: { type: Number },
  min_lvl: { type: Number },
  modifiers: { type: ModifiersSchema },
});

// Healing Potion Schema
const HealingPotionSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, auto: true },
  name: { type: String },
  description: { type: String },
  type: { type: String, enum: ["healing","essence"] },
  image: { type: String },
  value: { type: Number },
  min_lvl: { type: Number },
  modifiers: { type: ModifiersSchema },
});

// Weapon Schema
const WeaponSchema = new Schema({
  base_percentage: { type: Number },
  die_faces: { type: Number },
  die_modifier: { type: Number },
  die_num: { type: Number },
  isUnique: { type: Boolean },
  isActive: { type: Boolean },
  ...BaseEquipmentSchema.obj, // Inherit base equipment fields
});

// Armor Schema
const ArmorSchema = new Schema({
  defense: { type: Number },
  isUnique: { type: Boolean },
  isActive: { type: Boolean },
  ...BaseEquipmentSchema.obj,
});

// Artifact Schema
const ArtifactSchema = new Schema({
  ...BaseEquipmentSchema.obj,
});

// Recovery Effect Schema (for antidote potions)
const RecoveryEffectSchema = new Schema({
  modifiers: { type: ModifiersSchema },
  _id: { type: mongoose.Types.ObjectId, auto: true },
  name: { type: String },
  description: { type: String },
  type: { type: String },
  antidote_effects: { type: [String] },
  poison_effects: { type: [String] },
});

// Potion Schema
const PotionSchema = new Schema({
  recovery_effect: { type: RecoveryEffectSchema, default: null }, // Optional for certain potions
  duration: { type: Number, default: null }, // Optional, specific to enhancer potions
  ...BaseEquipmentSchema.obj,
});

// Shield Schema
const ShieldSchema = new Schema({
  defense: { type: Number },
  isUnique: { type: Boolean },
  isActive: { type: Boolean },
  ...BaseEquipmentSchema.obj,
});

// Helmet Schema
const HelmetSchema = new Schema({
  defense: { type: Number },
  isUnique: { type: Boolean },
  isActive: { type: Boolean },
  ...BaseEquipmentSchema.obj,
});

// Boot Schema
const BootSchema = new Schema({
  defense: { type: Number },
  isUnique: { type: Boolean },
  isActive: { type: Boolean },
  ...BaseEquipmentSchema.obj,
});

// Ring Schema
const RingSchema = new Schema({
  isUnique: { type: Boolean },
  isActive: { type: Boolean },
  ...BaseEquipmentSchema.obj,
});

// Main Equipment and Potions Schema
const EquipmentSchema = new Schema({
  weapon: { type: WeaponSchema },
  armor: { type: ArmorSchema },
  artifact: { type: ArtifactSchema },
  antidote_potion: { type: PotionSchema },
  healing_potion: { type: HealingPotionSchema },
  enhancer_potion: { type: EnhancerPotionSchema },
  helmet: { type: HelmetSchema },
  shield: { type: ShieldSchema },
  boot: { type: BootSchema },
  ring: { type: RingSchema },
});

// Models
export const Weapon = mongoose.model("Weapon", WeaponSchema);
export const Armor = mongoose.model("Armor", ArmorSchema);
export const Artifact = mongoose.model("Artifact", ArtifactSchema);
export const Potion = mongoose.model("Potion", PotionSchema);
export const Helmet = mongoose.model("Helmet", HelmetSchema);
export const Shield = mongoose.model("Shield", ShieldSchema);
export const Boot = mongoose.model("Boot", BootSchema);
export const Ring = mongoose.model("Ring", RingSchema);
export const HealingPotion = mongoose.model("HealingPotion", HealingPotionSchema);
export const EnhancerPotion = mongoose.model("EnhancerPotion", EnhancerPotionSchema);
export const Equipment = mongoose.model(
  "Equipment",
  EquipmentSchema
);


const profileAttributeSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  name: { type: String },
  description: { type: String },
  value: { type: Number }
}, { _id: false });

const profileSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  name: { type: String},
  description: { type: String },
  image: { type: String },
  attributes: [profileAttributeSchema]
}, { _id: false });

const taskSchema = new Schema({
  classroomId: { type: String },
  courseWorkName: { type: String },
  grade: { type: Number },
  selectedAssignment: { type: String },
  _id: mongoose.Types.ObjectId
}, { _id: false });

const inventorySchema = new Schema({
  helmets: [HelmetSchema],
  weapons: [WeaponSchema],
  armors: [ArmorSchema],
  shields: [ShieldSchema],
  artifacts: [ArtifactSchema],
  boots: [BootSchema],
  rings: [RingSchema],
  antidote_potions: [PotionSchema],
  healing_potions: [HealingPotionSchema],
  enhancer_potions: [EnhancerPotionSchema]
}, { _id: false });

const playerSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  name: { type: String},    
  nickname: { type: String },
  email: { type: String },
  role: { type: String },       //add role
  classroom_Id: { type: String },
  level: { type: Number},
  experience: { type: Number},
  is_active: { type: Boolean, default: false},
  is_inside_tower: { type: Boolean, default: false},
  isInHall: { type: Boolean, default: false},
  fcmToken: { type: String },
  cardId: { type: String },
  avatar: { type: String },
  created_date: { type: Date},
  gold: { type: Number},
  attributes: ModifiersSchema,
  socketId: { type: String },
  location: { type: String},
  equipment: {
    weapon: WeaponSchema,
    armor: ArmorSchema,
    artifact: ArtifactSchema,
    antidote_potion: PotionSchema,
    healing_potion: HealingPotionSchema,
    enhancer_potion: EnhancerPotionSchema,
    helmet: HelmetSchema,
    shield: ShieldSchema,
    boot: BootSchema,
    ring: RingSchema
  },
  inventory: inventorySchema,
  profile: profileSchema,
  tasks: [taskSchema],
  isbetrayer: {
    type: Boolean,
    default: null,
  },
  AngeloReduced: {type: Boolean},
  AngeloDelivered: {type: Boolean},
  resistance: {
    type: Number,
    default: 100, // Empezar en 100% si lo deseas
  },
  disease: {
    type: String,
    enum: [
      'PUTRID PLAGUE',      // Intelligence -75%
      'EPIC WEAKNESS',      // Strength -60%
      'MEDULAR APOCALYPSE', // Constitution -30%
      null
    ],
    default: null,
  },
  ethaziumCursed: {
    type: Boolean,
    default: false,
  },
  appLockedReason: {
    type: String,
    enum: ['DISEASE', 'ETHAZIUM_CURSE', null],
    default: null,
  },
});

export const Player = mongoose.model('Player', playerSchema);
import mongoose from 'mongoose';
import { type } from 'os';
const Schema = mongoose.Schema;

// Modifiers Schema
const ModifiersSchema = new Schema({
  intelligence: { type: Number, required: true },
  dexterity: { type: Number, required: true },
  constitution: { type: Number, required: true },
  insanity: { type: Number, required: true },
  charisma: { type: Number, required: true },
  strength: { type: Number, required: true },
  hit_points: { type: Number, default: 0 }, // Optional, specific to certain items
});

// Base Equipment Schema
const BaseEquipmentSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, required: true, auto: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  image: { type: String, required: true },
  value: { type: Number, required: true },
  min_lvl: { type: Number, required: true },
  modifiers: { type: ModifiersSchema, required: true },
});

// Weapon Schema
const WeaponSchema = new Schema({
  base_percentage: { type: Number, required: true },
  die_faces: { type: Number, required: true },
  die_modifier: { type: Number, required: true },
  die_num: { type: Number, required: true },
  ...BaseEquipmentSchema.obj, // Inherit base equipment fields
});

// Armor Schema
const ArmorSchema = new Schema({
  defense: { type: Number, required: true },
  isUnique: { type: Boolean, required: true },
  isActive: { type: Boolean, required: true },
  ...BaseEquipmentSchema.obj,
});

// Artifact Schema
const ArtifactSchema = new Schema({
  ...BaseEquipmentSchema.obj,
});

// Recovery Effect Schema (for antidote potions)
const RecoveryEffectSchema = new Schema({
  modifiers: { type: ModifiersSchema, required: true },
  _id: { type: mongoose.Types.ObjectId, required: true, auto: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  antidote_effects: { type: [String], required: true },
  poison_effects: { type: [String], required: true },
});

// Potion Schema
const PotionSchema = new Schema({
  recovery_effect: { type: RecoveryEffectSchema, default: null }, // Optional for certain potions
  duration: { type: Number, default: null }, // Optional, specific to enhancer potions
  ...BaseEquipmentSchema.obj,
});

// Shield Schema
const ShieldSchema = new Schema({
  defense: { type: Number, required: true },
  isUnique: { type: Boolean, required: true },
  isActive: { type: Boolean, required: true },
  ...BaseEquipmentSchema.obj,
});

// Helmet Schema
const HelmetSchema = new Schema({
  defense: { type: Number, required: true },
  isUnique: { type: Boolean, required: true },
  isActive: { type: Boolean, required: true },
  ...BaseEquipmentSchema.obj,
});

// Boot Schema
const BootSchema = new Schema({
  defense: { type: Number, required: true },
  isUnique: { type: Boolean, required: true },
  isActive: { type: Boolean, required: true },
  ...BaseEquipmentSchema.obj,
});

// Ring Schema
const RingSchema = new Schema({
  isUnique: { type: Boolean, required: true },
  isActive: { type: Boolean, required: true },
  ...BaseEquipmentSchema.obj,
});

// Main Equipment and Potions Schema
const EquipmentSchema = new Schema({
  weapon: { type: WeaponSchema, required: true },
  armor: { type: ArmorSchema, required: true },
  artifact: { type: ArtifactSchema, required: true },
  antidote_potion: { type: PotionSchema, required: true },
  healing_potion: { type: PotionSchema, required: true },
  enhancer_potion: { type: PotionSchema, required: true },
  helmet: { type: HelmetSchema, required: true },
  shield: { type: ShieldSchema, required: true },
  boot: { type: BootSchema, required: true },
  ring: { type: RingSchema, required: true },
});

// Enhancer Potion Schema
const EnhancerPotionSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, required: true, auto: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["enhancer"], required: true },
  image: { type: String, required: true },
  value: { type: Number, required: true },
  duration: { type: Number, required: true },
  min_lvl: { type: Number, required: true },
  modifiers: { type: ModifiersSchema, required: true },
});

// Healing Potion Schema
const HealingPotionSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, required: true, auto: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["healing"], required: true },
  image: { type: String, required: true },
  value: { type: Number, required: true },
  min_lvl: { type: Number, required: true },
  modifiers: { type: ModifiersSchema, required: true },
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
  tasks: [taskSchema]
});

export const Player = mongoose.model('Player', playerSchema);
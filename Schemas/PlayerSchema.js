import mongoose from 'mongoose';
import { type } from 'os';
const Schema = mongoose.Schema;

const modifierSchema = new Schema({
  intelligence: { type: Number},
  dexterity: { type: Number},
  constitution: { type: Number},
  insanity: { type: Number},
  charisma: { type: Number},
  strength: { type: Number},
  hit_points: { type: Number} 
}, { _id: false });

const equipmentSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  name: { type: String},
  description: { type: String },
  type: { type: String },
  image: { type: String },
  value: { type: Number},
  min_lvl: { type: Number},
  damage: { type: String },              
  base_percentage: { type: Number },      
  defense: { type: Number },          
  duration: { type: Number },               
  modifiers: modifierSchema
}, { _id: false });

const recoveryEffectSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  name: { type: String},
  description: { type: String },
  type: { type: String },
  modifiers: modifierSchema
}, { _id: false });

const antidotePotionSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  name: { type: String},
  description: { type: String },
  type: { type: String },
  image: { type: String },
  value: { type: Number},
  min_lvl: { type: Number},
  recovery_effect: recoveryEffectSchema
}, { _id: false });

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
  helmets: [equipmentSchema],
  weapons: [equipmentSchema],
  armors: [equipmentSchema],
  shields: [equipmentSchema],
  artifacts: [equipmentSchema],
  boots: [equipmentSchema],
  rings: [equipmentSchema],
  antidote_potions: [antidotePotionSchema],
  healing_potions: [equipmentSchema],
  enhancer_potions: [equipmentSchema]
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
  fcmToken: { type: String },
  avatar: { type: String },
  created_date: { type: Date},
  gold: { type: Number},
  attributes: modifierSchema,
  socketId: { type: String },
  equipment: {
    weapon: equipmentSchema,
    armor: equipmentSchema,
    artifact: equipmentSchema,
    antidote_potion: antidotePotionSchema,
    healing_potion: equipmentSchema,
    enhancer_potion: equipmentSchema,
    helmet: equipmentSchema,
    shield: equipmentSchema,
    boot: equipmentSchema,
    ring: equipmentSchema
  },
  inventory: inventorySchema,
  profile: profileSchema,
  tasks: [taskSchema]
});

export const Player = mongoose.model('Player', playerSchema);
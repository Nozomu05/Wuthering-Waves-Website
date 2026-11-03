export interface RawRoleInfo {
  Id: number;
  Name: string;
  Introduction: string;
  QualityId: number;
  ElementId: number;
  WeaponType: number;
  RoleType: number;
  IsTrial: boolean;
  RoleBody: string;
  BreachId: number;
  ResonantChainGroupId: number;
  SkillId: number;
  RoleHeadIconCircle: string;
  RolePortrait: string;
}

export interface RawRoleDevProject {
  RoleId: number;
  RecommandWeapon: number[];
}

export interface RawSkill {
  Id: number;
  SkillGroupId: number;
  SkillType: number;
  SkillName: string;
  SkillDescribe: string;
  SkillDetailNum: string[] | null;
  SkillLevelGroupId: number;
  MaxSkillLevel: number;
  DamageList: number[] | null;
  Icon: string;
}

export interface RawDamage {
  Id: number;
  Element: number;
  RelatedProperty: number;
  RateLv: number[] | null;
}

export interface RawResonantChain {
  Id: number;
  GroupId: number;
  GroupIndex: number;
  NodeName: string;
  AttributesDescription: string;
  AttributesDescriptionParams: string[] | null;
  NodeIcon: string;
}

export interface RawItemKeyValue {
  Key: number;
  Value: number;
}

export interface RawRoleBreach {
  Id: number;
  BreachGroupId: number;
  BreachLevel: number;
  MaxLevel: number;
  BreachConsume: RawItemKeyValue[] | null;
}

export interface RawSkillDescription {
  Id: number;
  SkillLevelGroupId: number;
  AttributeName: string;
  SkillDetailNum: { ArrayString: string[] }[] | null;
  Order: number;
}

export interface RawSkillLevel {
  Id: number;
  SkillLevelGroupId: number;
  SkillId: number;
  Consume: RawItemKeyValue[] | null;
}

export interface RawItemInfo {
  Id: number;
  Name: string;
  QualityId: number;
  Icon: string;
}

export interface RawWeaponProp {
  Id: number;
  Value: number;
  IsRatio: boolean;
}

export interface RawWeaponConf {
  ItemId: number;
  WeaponName: string;
  QualityId: number;
  WeaponType: number;
  FirstPropId: RawWeaponProp;
  FirstCurve: number;
  SecondPropId: RawWeaponProp;
  SecondCurve: number;
  Desc: string;
  DescParams: { ArrayString: string[] }[] | null;
  Icon: string;
  BreachId: number;
}

export interface RawWeaponPropertyGrowth {
  CurveId: number;
  Level: number;
  BreachLevel: number;
  CurveValue: number;
}

export interface RawWeaponBreach {
  Id: number;
  BreachId: number;
  Level: number;
  Consume: RawItemKeyValue[] | null;
  GoldConsume: number;
}

export interface RawPhantomItem {
  ItemId: number;
  MonsterName: string;
  QualityId: number;
  Rarity: number;
  FetterGroup: number[] | null;
  Icon: string;
  ShowInBag: boolean;
  SkillId: number;
}

export interface RawPhantomRarity {
  Rare: number;
  Cost: number;
}

export interface RawPhantomFetterGroupMapEntry {
  Key: number;
  Value: number;
}

export interface RawPhantomFetterGroup {
  Id: number;
  FetterGroupName: string;
  FetterMap: RawPhantomFetterGroupMapEntry[];
  FetterElementPath: string;
}

export interface RawPhantomFetter {
  Id: number;
  EffectDescription: string;
  EffectDescriptionParam: string[] | null;
}

export interface RawPhantomSkill {
  Id: number;
  PhantomSkillId: number;
  DescriptionEx: string;
  LevelDescStrArray: { ArrayString: string[] }[] | null;
}
